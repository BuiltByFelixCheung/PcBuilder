using ClosedXML.Excel;
using FluentAssertions;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Infrastructure.Services;

namespace PcBuilderBackend.Infrastructure.UnitTests.Services;

public class ClosedXmlExcelImportServiceCatalogTests
{
    private readonly ClosedXmlExcelImportService _sut = new();
    private readonly Guid _id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    [Fact]
    public async Task Parse_cpus_joins_ram_compats_and_chipsets()
    {
        await using var stream = Workbook(wb =>
        {
            var cpus = wb.Worksheets.Add("CPUs");
            Write(cpus, 1, ["Name", "ManufacturerId", "SocketId", "SeriesId", "MaxMemoryGb", "IGP", "Cooler", "TDP", "Watts"]);
            Write(cpus, 2, ["7800X3D", _id.ToString(), _id.ToString(), _id.ToString(), 128, true, false, 120, 120]);

            var ram = wb.Worksheets.Add("CpuRamCompats");
            Write(ram, 1, ["Parent", "Ddr", "Modules", "Rank", "Speed"]);
            Write(ram, 2, [2, "Ddr5", 2, "DualRank", 6000]);

            var chip = wb.Worksheets.Add("CpuSupportChipsets");
            Write(chip, 1, ["Parent", "ChipsetId", "Bios"]);
            Write(chip, 2, [2, _id.ToString(), false]);
        });

        var rows = await _sut.ParseCpuImportAsync(stream, CancellationToken.None);
        rows.Should().ContainSingle();
        rows[0].Name.Should().Be("7800X3D");
        rows[0].RamCompats.Should().ContainSingle(c => c.DdrGeneration == DdrGeneration.Ddr5 && c.MaxSpeedMts == 6000);
        rows[0].SupportChipsets.Should().ContainSingle(c => c.ChipsetId == _id);
    }

    [Fact]
    public async Task Parse_gpu_ram_storage_and_fan_sheets()
    {
        await using var gpuStream = Workbook(wb =>
        {
            var sheet = wb.Worksheets.Add("GPUs");
            Write(sheet, 1, ["Name", "ManufacturerId", "SeriesId"]);
            Write(sheet, 2, ["RTX 4070", _id.ToString(), _id.ToString()]);
        });
        (await _sut.ParseGpuImportAsync(gpuStream, CancellationToken.None))
            .Should().ContainSingle(x => x.Name == "RTX 4070" && x.SeriesId == _id);

        await using var ramStream = Workbook(wb =>
        {
            var sheet = wb.Worksheets.Add("RAMs");
            Write(sheet, 1, ["Name", "Mfg", "Color", "Ddr", "Form", "Rank", "Per", "Total", "Mods", "Speed", "H"]);
            Write(sheet, 2, ["Vengeance", _id.ToString(), "Black", "Ddr5", "UDimm", "DualRank", 16, 32, 2, 6000, 40]);
        });
        (await _sut.ParseRamImportAsync(ramStream, CancellationToken.None))
            .Should().ContainSingle(x => x.TotalMemorySizeGb == 32 && x.DdrGeneration == DdrGeneration.Ddr5);

        await using var storageStream = Workbook(wb =>
        {
            var sheet = wb.Worksheets.Add("StorageDrives");
            Write(sheet, 1, ["Name", "Mfg", "Media", "If", "FF", "Cap", "Pcie", "Rpm"]);
            Write(sheet, 2, ["990 PRO", _id.ToString(), "Ssd", "Nvme", "M22280", 2000, "Gen4", ""]);
        });
        (await _sut.ParseStorageDriveImportAsync(storageStream, CancellationToken.None))
            .Should().ContainSingle(x => x.CapacityGb == 2000 && x.PcieGeneration == PcieGeneration.Gen4);

        await using var fanStream = Workbook(wb =>
        {
            var sheet = wb.Worksheets.Add("ChassisFans");
            Write(sheet, 1, ["Name", "Mfg", "Dia", "Count"]);
            Write(sheet, 2, ["LL120", _id.ToString(), "Mm120", 3]);
        });
        (await _sut.ParseChassisFanImportAsync(fanStream, CancellationToken.None))
            .Should().ContainSingle(x => x.DiameterMm == FanDiameterMm.Mm120 && x.FansCountPerPack == 3);
    }

    [Fact]
    public async Task Parse_wired_adapter_and_invalid_guid()
    {
        await using var stream = Workbook(wb =>
        {
            var sheet = wb.Worksheets.Add("WiredNetworkAdapters");
            Write(sheet, 1, ["Name", "Mfg", "Host", "Speed", "UsbV", "UsbT", "Pcie"]);
            Write(sheet, 2, ["I225-V", "not-a-guid", "Pcie", 2500, "", "", "X1"]);
        });

        var rows = await _sut.ParseWiredNetworkAdapterImportAsync(stream, CancellationToken.None);
        rows[0].ManufacturerId.Should().Be(Guid.Empty);
        rows[0].HostInterface.Should().Be(WiredHostInterface.Pcie);
        rows[0].PcieSlotType.Should().Be(PcieSlotType.X1);
    }

    [Fact]
    public async Task Parse_motherboard_joins_child_sheets()
    {
        await using var stream = Workbook(wb =>
        {
            var boards = wb.Worksheets.Add("Motherboards");
            Write(boards, 1, ["Name", "Mfg", "Sock", "Chip", "Ram", "Max", "Dimm", "Sata", "Fan", "Eps", "W", "H", "Ddr", "RamFF", "FF", "Wifi", "Bt"]);
            Write(boards, 2, ["B650", _id.ToString(), _id.ToString(), _id.ToString(), 4, 128, 48, 4, 4, 2, 244, 305, "Ddr5", "UDimm", "Atx", true, false]);

            var pcie = wb.Worksheets.Add("MotherboardPcieSlots");
            Write(pcie, 1, ["Parent", "Type", "Lanes", "Gen", "Count"]);
            Write(pcie, 2, [2, "X16", "X16", "Gen4", 1]);

            var m2 = wb.Worksheets.Add("MotherboardM2Slots");
            Write(m2, 1, ["Parent", "Gen", "Count", "FF", "Key", "Sata"]);
            Write(m2, 2, [2, "Gen4", 1, "M22280", "M", true]);

            var usb = wb.Worksheets.Add("MotherboardUsbPorts");
            Write(usb, 1, ["Parent", "Ver", "Type", "Count"]);
            Write(usb, 2, [2, "Usb32Gen2", "TypeA", 4]);
        });

        var rows = await _sut.ParseMotherboardImportAsync(stream, CancellationToken.None);
        rows.Should().ContainSingle();
        rows[0].PcieSlots.Should().ContainSingle();
        rows[0].M2Slots.Should().ContainSingle(s => s.Key == M2Key.M && s.FormFactors.Contains(M2FormFactor.M22280));
        rows[0].UsbPorts.Should().ContainSingle();
    }

    [Fact]
    public async Task Parse_motherboard_collapses_identical_m2_slots_and_keeps_distinct_groups()
    {
        await using var stream = Workbook(wb =>
        {
            var boards = wb.Worksheets.Add("Motherboards");
            Write(boards, 1, ["Name", "Mfg", "Sock", "Chip", "Ram", "Max", "Dimm", "Sata", "Fan", "Eps", "W", "H", "Ddr", "RamFF", "FF", "Wifi", "Bt"]);
            Write(boards, 2, ["B650", _id.ToString(), _id.ToString(), _id.ToString(), 4, 128, 48, 4, 4, 2, 244, 305, "Ddr5", "UDimm", "Atx", true, false]);

            var pcie = wb.Worksheets.Add("MotherboardPcieSlots");
            Write(pcie, 1, ["Parent", "Type", "Lanes", "Gen", "Count"]);
            Write(pcie, 2, [2, "X16", "X16", "Gen4", 1]);

            var m2 = wb.Worksheets.Add("MotherboardM2Slots");
            Write(m2, 1, ["Parent", "Gen", "Count", "FF", "Key", "Sata"]);
            Write(m2, 2, [2, "Gen4", 1, "M22280,M22260,M22242", "M", false]);
            Write(m2, 3, [2, "Gen4", 1, "M22280", "M", true]);
            Write(m2, 4, [2, "Gen4", 1, "M22280", "M", false]);
            Write(m2, 5, [2, "Gen4", 1, "M22280", "M", false]);

            var usb = wb.Worksheets.Add("MotherboardUsbPorts");
            Write(usb, 1, ["Parent", "Ver", "Type", "Count"]);
            Write(usb, 2, [2, "Usb32Gen2", "TypeA", 4]);
        });

        var rows = await _sut.ParseMotherboardImportAsync(stream, CancellationToken.None);
        var slots = rows.Should().ContainSingle().Subject.M2Slots;
        slots.Should().HaveCount(3);
        slots.Should().ContainSingle(s =>
            s.SupportsSata && s.SlotCount == 1 && s.FormFactors.Single() == M2FormFactor.M22280);
        slots.Should().ContainSingle(s =>
            !s.SupportsSata && s.SlotCount == 2 && s.FormFactors.Single() == M2FormFactor.M22280);
        slots.Should().ContainSingle(s =>
            !s.SupportsSata && s.SlotCount == 1 && s.FormFactors.Count == 3);
    }

    [Fact]
    public async Task Parse_skips_empty_cpu_and_child_rows()
    {
        await using var stream = Workbook(wb =>
        {
            var cpus = wb.Worksheets.Add("CPUs");
            Write(cpus, 1, ["Name", "ManufacturerId", "SocketId", "SeriesId", "MaxMemoryGb", "IGP", "Cooler", "TDP", "Watts"]);
            Write(cpus, 2, ["7800X3D", _id.ToString(), _id.ToString(), _id.ToString(), 128, true, false, 120, 120]);
            Write(cpus, 3, ["", "", "", "", "", "", "", "", ""]);
            Write(cpus, 4, ["9950X", _id.ToString(), _id.ToString(), _id.ToString(), 192, true, false, 170, 170]);

            var ram = wb.Worksheets.Add("CpuRamCompats");
            Write(ram, 1, ["Parent", "Ddr", "Modules", "Rank", "Speed"]);
            Write(ram, 2, [2, "Ddr5", 2, "DualRank", 6000]);
            Write(ram, 3, ["", "", "", "", ""]);
            Write(ram, 4, [4, "Ddr5", 2, "DualRank", 5600]);

            var chip = wb.Worksheets.Add("CpuSupportChipsets");
            Write(chip, 1, ["Parent", "ChipsetId", "Bios"]);
            Write(chip, 2, ["", "", ""]);
            Write(chip, 3, [2, _id.ToString(), false]);
        });

        var rows = await _sut.ParseCpuImportAsync(stream, CancellationToken.None);
        rows.Should().HaveCount(2);
        rows[0].Name.Should().Be("7800X3D");
        rows[0].RamCompats.Should().ContainSingle();
        rows[0].SupportChipsets.Should().ContainSingle();
        rows[1].Name.Should().Be("9950X");
        rows[1].RamCompats.Should().ContainSingle(c => c.MaxSpeedMts == 5600);
        rows[1].SupportChipsets.Should().BeEmpty();
    }

    [Fact]
    public async Task Parse_graphics_cards_reads_is_low_profile()
    {
        await using var stream = Workbook(wb =>
        {
            var sheet = wb.Worksheets.Add("GraphicsCards");
            Write(sheet, 1, [
                "Name", "ManufacturerId", "GpuId", "VideoMemoryGb", "PcieSlotsUsed",
                "PcieGeneration", "IsLowProfile", "LengthMm", "WidthMm", "HeightMm",
                "PowerConsumptionWatts", "PowerConnectorType", "PowerConnectorCount"
            ]);
            Write(sheet, 2, [
                "LP Card", _id.ToString(), _id.ToString(), 6, 2, "Gen4", true,
                181, 69, 36, 70, "Pcie6Plus2Pin", 1
            ]);
            Write(sheet, 3, [
                "Full Card", _id.ToString(), _id.ToString(), 8, 2, "Gen4", false,
                240, 120, 50, 115, "Pcie6Plus2Pin", 1
            ]);
        });

        var rows = await _sut.ParseGraphicsCardImportAsync(stream, CancellationToken.None);
        rows.Should().HaveCount(2);
        rows[0].Should().BeEquivalentTo(new
        {
            Name = "LP Card",
            IsLowProfile = true,
            LengthMm = 181m,
            PowerConnectorCount = 1
        });
        rows[1].IsLowProfile.Should().BeFalse();
        rows[1].LengthMm.Should().Be(240m);
    }

    [Fact]
    public async Task Parse_graphics_cards_reads_numeric_text_and_boolean_text()
    {
        await using var stream = Workbook(wb =>
        {
            var sheet = wb.Worksheets.Add("GraphicsCards");
            Write(sheet, 1, [
                "Name", "ManufacturerId", "GpuId", "VideoMemoryGb", "PcieSlotsUsed",
                "PcieGeneration", "IsLowProfile", "LengthMm", "WidthMm", "HeightMm",
                "PowerConsumptionWatts", "PowerConnectorType", "PowerConnectorCount"
            ]);
            sheet.Cell(2, 1).Value = "LP Card";
            sheet.Cell(2, 2).Value = _id.ToString();
            sheet.Cell(2, 3).Value = _id.ToString();
            sheet.Cell(2, 4).Value = "6";
            sheet.Cell(2, 5).Value = "2";
            sheet.Cell(2, 6).Value = "Gen4";
            sheet.Cell(2, 7).Value = "TRUE";
            sheet.Cell(2, 8).Value = "181.5";
            sheet.Cell(2, 9).Value = "69";
            sheet.Cell(2, 10).Value = "36";
            sheet.Cell(2, 11).Value = "70";
            sheet.Cell(2, 12).Value = "Pcie6Plus2Pin";
            sheet.Cell(2, 13).Value = "1";
        });

        var rows = await _sut.ParseGraphicsCardImportAsync(stream, CancellationToken.None);
        rows.Should().ContainSingle();
        rows[0].VideoMemoryGb.Should().Be(6);
        rows[0].IsLowProfile.Should().BeTrue();
        rows[0].LengthMm.Should().Be(181.5m);
    }

    [Fact]
    public async Task Missing_required_sheet_throws()
    {
        await using var stream = Workbook(wb => wb.Worksheets.Add("Other"));
        var act = () => _sut.ParseGpuImportAsync(stream, CancellationToken.None);
        await act.Should().ThrowAsync<ArgumentException>();
    }

    private static MemoryStream Workbook(Action<XLWorkbook> configure)
    {
        using var workbook = new XLWorkbook();
        configure(workbook);
        var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return stream;
    }

    private static void Write(IXLWorksheet sheet, int row, IReadOnlyList<object> values)
    {
        for (var i = 0; i < values.Count; i++)
        {
            sheet.Cell(row, i + 1).Value = values[i] switch
            {
                int n => n,
                double d => d,
                decimal m => m,
                bool b => b,
                string s => s,
                _ => values[i]?.ToString() ?? string.Empty
            };
        }
    }
}
