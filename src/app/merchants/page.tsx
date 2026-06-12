import { redirect } from "next/navigation";

// 혜택 탭은 '발견'으로 흡수됨(온누리·전통시장은 먹거리/마실거리 카드 뱃지로 노출).
// 기존 링크 보호용 리다이렉트.
export default function MerchantsRedirect() {
  redirect("/");
}
