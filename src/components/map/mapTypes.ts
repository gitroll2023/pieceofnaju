import type { Place } from "@/lib/data/types";

/** 지도 위 클러스터 레이어 포인트 (KB 가맹점 등 대량 표시용) */
export interface ClusterPoint {
  lat: number;
  lng: number;
  name: string;
  sub?: string;
}

/** 지도 컴포넌트 공용 props (카카오/Leaflet/일러스트 공통) */
export interface MapProps {
  places: Place[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
  /** 선택적 클러스터 레이어 (카카오에서만 표시) */
  clusterPoints?: ClusterPoint[];
}
