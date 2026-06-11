import { notFound } from "next/navigation";
import { places, getPlace } from "@/lib/data/places";
import BackHeader from "@/components/shell/BackHeader";
import PlaceHero from "@/components/place/PlaceHero";
import EditorQuote from "@/components/place/EditorQuote";
import MenuList from "@/components/place/MenuList";
import PlaceInfo from "@/components/place/PlaceInfo";
import PlaceLocation from "@/components/place/PlaceLocation";
import InstaCta from "@/components/place/InstaCta";

// 모든 장소 id를 빌드 타임에 정적 생성
export function generateStaticParams() {
  return places.map((p) => ({ id: p.id }));
}

export default async function Page({ params }: PageProps<"/place/[id]">) {
  const { id } = await params;
  const place = getPlace(id);
  if (!place) notFound();

  return (
    <div className="pb-6">
      <BackHeader title={place.name} />

      <PlaceHero place={place} />
      <EditorQuote note={place.editorNote} />
      <MenuList place={place} />
      <PlaceInfo place={place} />
      <PlaceLocation place={place} />
      <InstaCta />

      <p className="px-4 pt-6 text-center text-[11px] leading-relaxed text-ink-soft/70">
        가격·영업시간·별점은 공개 자료를 토대로 한 근사치예요. 방문 전 한 번 더
        확인해 주세요.
      </p>
    </div>
  );
}
