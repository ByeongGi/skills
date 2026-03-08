import { getRegistry } from "@/lib/registry";
import SkillListClient from "./SkillListClient";

export default async function HomePage() {
  const registry = await getRegistry();
  return <SkillListClient skills={registry.skills} />;
}
