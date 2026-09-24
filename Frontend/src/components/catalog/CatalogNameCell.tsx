import { Link } from "react-router-dom";

export function catalogNameCell(to: string, name: string) {
  return <Link to={to}>{name}</Link>;
}
