import Link from "next/link";

export const metadata = { title: "개인정보처리방침 · 나주한조각" };

export default function PrivacyPage() {
  return (
    <div className="min-h-[calc(100dvh_-_72px)] bg-background px-5 pb-10 pt-7">
      <Link href="/pieces" className="text-[12.5px] font-bold text-river">← 내조각</Link>
      <h1 className="brand-serif mt-2 text-[24px] font-extrabold text-ink">개인정보처리방침</h1>
      <p className="mt-1 text-[12px] text-ink-soft">나주한조각 (비영리 · 나주 관광 홍보 서비스)</p>

      <div className="mt-5 space-y-5 text-[13px] leading-relaxed text-ink-soft">
        <section>
          <h2 className="text-[14px] font-bold text-ink">1. 수집하는 정보</h2>
          <p className="mt-1">회원가입 시 <b className="text-ink">닉네임과 비밀번호</b>만 수집합니다. 비밀번호는 복호화 불가능한 방식(해시)으로 저장되어 운영자도 알 수 없습니다.</p>
          <p className="mt-1"><b className="text-ink">실명·생년월일·이메일·전화번호·주소는 수집하지 않습니다.</b> 프로필의 인스타그램·블로그·유튜브 링크는 본인이 원할 때만 선택적으로 입력합니다.</p>
          <p className="mt-1">내가 모은 ‘조각’과 여행 코스·일정은 회원의 경우에만 서버에 저장되며, 비회원은 본인 기기(브라우저)에만 저장됩니다.</p>
        </section>
        <section>
          <h2 className="text-[14px] font-bold text-ink">2. 이용 목적</h2>
          <p className="mt-1">기기가 바뀌어도 내 조각·코스를 이어가기 위한 동기화, 그리고 본인이 선택한 경우의 커뮤니티 공유에만 사용합니다. 광고·마케팅·제3자 제공에 사용하지 않습니다.</p>
        </section>
        <section>
          <h2 className="text-[14px] font-bold text-ink">3. 보관 및 파기</h2>
          <p className="mt-1">정보는 회원 탈퇴 시 <b className="text-ink">즉시 모두 삭제</b>됩니다(조각·코스·작성글 포함). 내조각 화면에서 언제든 탈퇴할 수 있습니다.</p>
        </section>
        <section>
          <h2 className="text-[14px] font-bold text-ink">4. 위치 정보</h2>
          <p className="mt-1">‘내 주변’ 기능은 브라우저에서 일시적으로만 사용하며, 위치를 서버에 저장하지 않습니다.</p>
        </section>
        <section>
          <h2 className="text-[14px] font-bold text-ink">5. 이용자 권리</h2>
          <p className="mt-1">언제든 본인 정보 열람·수정·삭제 및 회원 탈퇴를 요청할 수 있습니다.</p>
        </section>
        <section>
          <h2 className="text-[14px] font-bold text-ink">6. 문의</h2>
          <p className="mt-1">개인정보 관련 문의는 인스타그램 <b className="text-ink">@piece_of_naju</b> 또는 앱 내 ‘건의하기’로 받습니다.</p>
        </section>
      </div>
    </div>
  );
}
