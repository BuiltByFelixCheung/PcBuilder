import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()

vi.mock('@/api/client.ts', () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
  },
}))

import {
  listChipsets,
  listCpuSeries,
  listManufacturers,
  listManufacturersByProductType,
  listSockets,
  masterDataKeys,
} from '@/api/master-data.ts'

describe('master-data API', () => {
  beforeEach(() => {
    get.mockReset()
  })

  it('lists manufacturers by product type', async () => {
    get.mockResolvedValue({ data: [{ id: 'amd', name: 'AMD' }] })
    await expect(listManufacturersByProductType('cpu')).resolves.toEqual([
      { id: 'amd', name: 'AMD' },
    ])
    expect(get).toHaveBeenCalledWith('/master-data/manufacturer/cpu')
    expect(masterDataKeys.manufacturersByProductType('cpu')).toEqual([
      'master-data',
      'manufacturers',
      'cpu',
    ])
  })

  it('lists manufacturers, sockets, and CPU series', async () => {
    get.mockResolvedValueOnce({ data: [{ id: 'amd', name: 'AMD' }] })
    await expect(listManufacturers()).resolves.toEqual([{ id: 'amd', name: 'AMD' }])
    expect(get).toHaveBeenCalledWith('/master-data/manufacturer')

    get.mockResolvedValueOnce({
      data: [{ id: 'am5', name: 'AM5', manufacturerId: 'amd', manufacturerName: 'AMD' }],
    })
    await expect(listSockets()).resolves.toEqual([
      { id: 'am5', name: 'AM5', manufacturerId: 'amd', manufacturerName: 'AMD' },
    ])
    expect(get).toHaveBeenCalledWith('/master-data/socket')

    get.mockResolvedValueOnce({
      data: [
        {
          id: 'r7',
          name: 'Ryzen 7',
          manufacturerId: 'amd',
          manufacturerName: 'AMD',
          socketId: 'am5',
          socketName: 'AM5',
        },
      ],
    })
    await expect(listCpuSeries()).resolves.toEqual([
      {
        id: 'r7',
        name: 'Ryzen 7',
        manufacturerId: 'amd',
        manufacturerName: 'AMD',
        socketId: 'am5',
        socketName: 'AM5',
      },
    ])
    expect(get).toHaveBeenCalledWith('/master-data/cpu-series')
  })

  it('lists chipsets', async () => {
    get.mockResolvedValue({
      data: [
        {
          id: 'x870',
          name: 'X870',
          manufacturerId: 'amd',
          manufacturerName: 'AMD',
          socketId: 'am5',
          socketName: 'AM5',
        },
      ],
    })
    await expect(listChipsets()).resolves.toEqual([
      {
        id: 'x870',
        name: 'X870',
        manufacturerId: 'amd',
        manufacturerName: 'AMD',
        socketId: 'am5',
        socketName: 'AM5',
      },
    ])
    expect(get).toHaveBeenCalledWith('/master-data/chipset')
    expect(masterDataKeys.chipsets).toEqual(['master-data', 'chipsets'])
  })
})
