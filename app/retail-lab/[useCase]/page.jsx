import { notFound } from "next/navigation";
import { getSource } from "../../../lib/retail/source";
import { runUseCase } from "../../../lib/retail/engine";
import { LAB } from "../content";
import UseCaseClient from "./UseCaseClient";

export const revalidate = 600;

export function generateStaticParams() {
  return Object.keys(LAB).map((useCase) => ({ useCase }));
}

export async function generateMetadata({ params }) {
  const { useCase } = await params;
  const c = LAB[useCase];
  if (!c) return {};
  return { title: `${c.video} · Agentic Retail Lab`, description: c.intro };
}

export default async function UseCasePage({ params }) {
  const { useCase } = await params;
  if (!LAB[useCase]) notFound();
  const source = await getSource();
  const [initial, products, stores, vendors] = await Promise.all([runUseCase(useCase, source), source.get("products"), source.get("stores"), source.get("vendors")]);
  const catalog = {
    products: products.map(({ style_id, name, lifecycle, category, current_method }) => ({ style_id, name, lifecycle, category, current_method })),
    stores: stores.map(({ store_no, name, region }) => ({ store_no, name, region })),
    vendors: vendors.map(({ vendor_id, name }) => ({ vendor_id, name })),
  };
  return <UseCaseClient id={useCase} initial={initial} catalog={catalog} />;
}
