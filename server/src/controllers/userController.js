import jwt from "jsonwebtoken";
import jwtDecode from "jwt-decode";
import jwksClient from "jwks-rsa";
import redisClient from "../utils/redis";
import throwError from "../utils/throwError";
import tokenApi from "../utils/tokenApi";
import User from "../models/User";
import Seat from "../models/Seat";
import Like from "../models/Like";
import Theater from "../models/Theater";
import userExist from "../utils/userExist";
import { verify, sign, refresh, refreshVerify } from "../utils/jwt";
import logger from "../config/logger";
import Review from "../models/Review";
import { s3 } from "../aws";
import Scrap from "../models/Scrap";

const { FACEBOOK_ID } = process.env;

const client = jwksClient({
  jwksUri: "https://appleid.apple.com/auth/keys",
});

const getAppleSigningKey = (kid) => {
  return new Promise((resolve) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) {
        console.error(err);
        resolve(null);
        return;
      }
      const signingKey = key.getPublicKey();
      resolve(signingKey);
    });
  });
};

export const getPrivacy = (req, res, next) => {
  try {
    const html = `
    <p><strong>개인정보처리방침</strong></p>
    <p>본 방침은 2021년 11월 1일부터 적용됩니다.</p>
    <p>CURIOUSER가 운영하는 어플 &lt;보고보고&gt;(이하 &lt;보고보고&gt;)는 개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고 개인정보와 관련한 이용자의 고충을 원활하게 처리할 수 있도록 다음과 같은 처리 방침을 두고 있습니다.</p>
    <p>CURIOUSER가 운영하는 &lt;보고보고&gt; 는 대한민국의 개인정보 보호 관련 주요 법률인 개인정보보호법, 정보통신망 이용촉진 및 정보보호 등에 관한 법률(이하 &ldquo;정보통신망법&rdquo;이라고 합니다)을 비롯한 개인정보 보호에 관련 법률 규정 및 국가기관 등이 제정한 고시, 훈령, 지침 등을 준수합니다.</p>
    <p>본 개인정보처리방침은 CURIOSUER의 서비스를 이용하는 회원에 대하여 적용되며, 회원이 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보 보호를 위하여 CURIOSUER가 어떠한 조치를 취하고 있는지 알려 드립니다. 또한 개인정보와 관련하여 CURIOSUER와 회원 간의 권리 및 의무 관계를 규정하여 회원의 &lsquo;개인정보자기결정권&rsquo;을 보장하는 수단이 됩니다.</p>
    <p>CURIOSUER는 개인정보처리방침을 개정하는 경우 어플 내 공지사항(또는 개별공지)을 통하여 공지할 것입니다.</p>
    <ol>
        <li><strong>개인정보의 처리 목적</strong></li>
    </ol>
    <p>CURIOSUER가 운영하는 &lt;보고보고&gt;는 개인정보를 다음의 목적을 위해 처리합니다. 처리한 개인정보는 다음의 목적이외의 용도로는 사용되지 않으며 이용 목적이 변경될 시에는 사전 고지할 예정입니다.</p>
    <p>가. 어플 회원가입 및 관리</p>
    <p>회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별&middot;인증, 본인 확인에 의한 부정 이용 방지 및 비인가사용 방지, 회원자격 유지&middot;관리, 각종 고지&middot;통지, 분쟁 조정을 위한 기록 보존, 불만처리 등 민원처리, 고지사항 전달, 회원 탈퇴 의사 확인 등을 목적으로 개인 정보를 처리합니다.</p>
    <p>나. 재화 또는 서비스 제공</p>
    <p>이벤트 서비스 제공, 맞춤형 서비스 제공 등을 목적으로 개인정보를 처리합니다.</p>
    <p>다. 마케팅 및 광고에의 활용</p>
    <ol>
        <li><strong>개인정보 처리 및 보유 기간</strong></li>
    </ol>
    <p>CURIOSUER는 법령에 따른 개인정보 보유&middot;이용기간 또는 정보주체로부터 개인정보를 수집시에 동의 받은 개인정보 보유, 이용기간 내에서 개인정보를 처리, 보유합니다. 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.</p>
    <p>가. 어플 회원가입 및 관리</p>
    <ul>
        <li>개인정보는 수집 및 이용에 관한 동의일로부터 회원 탈퇴시까지 위 이용목적을 위해 보유 및 이용됩니다.</li>
    </ul>
    <p>나. 재화 또는 서비스 제공</p>
    <ul>
        <li>개인정보는 수집 및 이용에 관한 동의일로부터 회원 탈퇴시까지 위 이용목적을 위해 보유 및 이용됩니다.</li>
    </ul>
    <p>다. 마케팅 및 광고에의 활용</p>
    <ol>
        <li><strong>정보주체와 법정대리인의 권리&middot;의무 및 행사방법</strong></li>
    </ol>
    <p>회원은 개인정보주체로써 다음과 같은 권리를 행사할 수 있습니다.</p>
    <ul>
        <li>정보주체는 CURIOSUER에 대해 언제든지 &lsquo;회원정보 조회/변경&rsquo; 및 &lsquo;회원탈퇴&rsquo; 등을 통하여 개인정보 열람, 정정, 삭제, 처리정지 요구 등의 권리를 행사할 수 있습니다.</li>
        <li>제1항에 따른 권리 행사는 CURIOSUER에 대해 개인정보보호법에 따라 서면, 전자우편 등을 통하여 하실 수 있으며, CURIOSUER]는 이에 대해 지체없이 조치하겠습니다.</li>
    </ul>
    <p>③ 제1항에 따른 권리 행사는 정보주체의 법정대리인이나 위임을 받은 자 등 대리인을 통하여 하실 수 있습니다. 이 경우 개인정보 보호법 시행규칙 별지 제11호 서식에 따른 위임장을 제출하셔야 합니다.</p>
    <p>④ 개인정보 열람 및 처리정지 요구는 개인정보보호법 제35조 제5항, 제37조 제2항에 의하여 정보주체의 권리가 제한될 수 있습니다.</p>
    <p>⑤ 개인정보의 정정 및 삭제 요구는 다른 법령에서 그 개인정보가 수집 대상으로 명시되어 있는 경우에는 그 삭제를 요구할 수 없습니다.</p>
    <p>⑥ CURIOSUER는 정보주체 권리에 따른 열람의 요구, 정정&middot;삭제의 요구, 처리정지의 요구 시 열람 등 요구를 한 자가 본인이거나 정당한 대리인인지를 확인합니다.</p>
    <ol>
        <li><strong>처리하는 개인정보 항목</strong></li>
    </ol>
    <p>&lt;보고보고&gt;는 다음의 개인정보 항목을 처리하고 있습니다.</p>
    <p>가. 어플 회원 가입 및 관리</p>
    <ul>
        <li>
            <p>구글 : 구글 ID 코드</p>
        </li>
        <li>
            <p>페이스북 :페이스북 ID 코드</p>
        </li>
        <li>
            <p>카카오 : 카카오 ID 코드</p>
        </li>
        <li>
            <p>애플 : Apple ID 코드</p>
        </li>
    </ul>
    <p>나. 재화 또는 서비스 제공(수집/이용 항목)</p>
    <ul>
        <li>
            <p>로그인ID, 서비스 이용 기록, 접속 로그</p>
        </li>
        <li>
            <p>프로필 사진 수정 시 : 프로필 사진</p>
        </li>
        <li>
            <p>SNS 이벤트 참여 시 : SNS 아이디, 닉네임, 프로필 이미지 ( SNS : 인스타그램, 트위터, 페이스북, 카카오톡 )</p>
        </li>
        <li>
            <p>앱 알림 설정 동의 시 : PUSH 토큰</p>
        </li>
        <li>
            <p>서비스 이용 과정에서 생성/수집 : 서비스 이용기록, 접속기록, IP주소, 쿠키,</p>
        </li>
    </ul>
    <p>다. 마케팅 및 광고에의 활용</p>
    <ul>
        <li>로그인ID, 서비스 이용 기록, 접속 로그</li>
    </ul>
    <ol>
        <li><strong>개인정보의 파기 절차 및 방법에 관한 사항</strong></li>
    </ol>
    <p>가. CURIOUSER는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
    <ul>
        <li>파기절차</li>
    </ul>
    <p>이용자가 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져(종이의 경우 별도의 서류) 내부 방침 및 기타 관련 법령에 따라 일정기간 저장된 후 혹은 즉시 파기됩니다. 이 때, DB로 옮겨진 개인정보는 관련 법률에 의한 경우를 제외하면 다른 목적으로 이용되지 않습니다.</p>
    <ul>
        <li>파기기한</li>
    </ul>
    <p>이용자의 개인정보는 개인정보의 보유기간이 경과된 경우에는 보유기간의 종료일로부터 5일 이내에, 개인정보의 처리 목적 달성, 해당 서비스의 폐지, 사업의 종료 등 그 개인정보가 불필요하게 되었을 때에는 개인정보의 처리가 불필요한 것으로 인정되는 날로부터 5일 이내에 그 개인정보를 파기합니다.</p>
    <ul>
        <li>파기방법</li>
    </ul>
    <p>전자적 파일 형태의 개인정보는 기록을 재생할 수 없도록 파기하며, 종이 문서 형태의 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.</p>
    <ol>
        <li><strong>개인정보 자동 수집 장치의 설치&bull;운영 및 거부에 관한 사항</strong></li>
    </ol>
    <p>① CURIOUSER는 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 &lsquo;쿠기(cookie)&rsquo;를 사용합니다.</p>
    <p>② 쿠키는 웹사이트를 운영하는데 이용되는 서버(http)가 이용자의 컴퓨터 브라우저에게 보내는 소량의 정보이며 이용자들의 PC 컴퓨터내의 하드디스크에 저장되기도 합니다.</p>
    <p>가. 쿠키의 사용 목적: 이용자가 방문한 각 서비스와 웹 사이트들에 대한 방문 및 이용형태, 인기 검색어, 보안접속 여부, 등을 파악하여 이용자에게 최적화된 정보 제공을 위해 사용됩니다.</p>
    <p>나. 쿠키의 설치&bull;운영 및 거부: 웹브라우저 상단의 도구&gt;인터넷 옵션&gt;개인정보 메뉴의 옵션 설정을 통해 쿠키 저장을 거부할 수 있습니다.</p>
    <p>다. 쿠키 저장을 거부할 경우 맞춤형 서비스 이용에 어려움이 발생할 수 있습니다.</p>
    <ol>
        <li><strong>개인정보 보호책임자</strong></li>
    </ol>
    <p><strong>①</strong> &lt;보고보고&gt;는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
    <p>▶ 개인정보 보호책임자</p>
    <p>성명: 이예림</p>
    <p>직위 : 대표</p>
    <p>연락처 : <a href="mailto:curiouser2021@gmail.com">curiouser2021@gmail.com</a> ,</p>
    <p>정보주체께서는 보고보고의 서비스(또는 사업)을 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자 및 담당부서로 문의하실 수 있습니다. CURIOUSER는 정보주체의 문의에 대해 지체 없이 답변 및 처리해드릴 것입니다.</p>
    <p>기타 개인정보침해에 대한 신고나 상담이 필요하신 경우에는 아래 기관에 문의하시기 바랍니다. 1. 개인정보분쟁조정위원회 (<a href="http://www.kopico.go.kr/">www.kopico.go.kr</a>/1833-6972) 2. 정보보호마크인증위원회 (<a href="https://www.lifeplus.co.kr/privacy/www.eprivacy.or.kr">www.eprivacy.or.kr</a>/02-550-9531) 3. 대검찰청 사이버범죄수사단 (<a href="http://www.spo.go.kr/02-3480-3573">www.spo.go.kr/02-3480-3573</a>) 4. 경찰청 사이버안전국 (<a href="http://www.ctrc.go.kr/">cyberbureau.police.go.kr, 국번없이 182</a>)</p>
    <ol>
        <li><strong>개인정보 처리방침 변경</strong></li>
    </ol>
    <p>이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다. 개인정보 수집, 이용, 제공과 관련 이메일 문의 등을 통해 개인정보의 수집, 이용, 제공에 대해 동의하신 내용을 이용자는 언제든지 철회하실 수 있습니다. 동의철회는 개인정보관리책임자에게 서면, 전화, 이메일 등으로 연락하시면 즉시 개인정보의 삭제 등 필요한 조치를 하겠습니다. 동의 철회를 하고 개인정보를 파기하는 등의 조치를 취한 경우에는 그 사실을 이용자에게 지체 없이 통지하도록 하겠습니다.</p>
    <ol>
        <li><strong>개인정보의 안전성 확보 조치</strong></li>
    </ol>
    <p>CURIOUSER는 개인정보보호법에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 물리적 조치를 하고 있습니다..</p>
    <ol>
        <li>
            <p>개인정보 취급 직원의 최소화 및 교육: 개인정보를 취급하는 직원을 지정하고 담당자에 한정시켜 최소화하여 개인정보를 관리하는 대책을 시행하고 있습니다.</p>
        </li>
        <li>
            <p>내부관리계획의 수립 및 시행: 개인정보의 안전한 처리를 위하여 내부관리계획을 수립하고 시행하고 있습니다.</p>
        </li>
        <li>
            <p>해킹 등에 대비한 기술적 대책: CURIOUSER는 해킹이나 컴퓨터 바이러스 등에 의한 개인정보 유출 및 훼손을 막기 위하여 보안프로그램을 설치하고 주기적인 갱신&middot;점검을 하며 외부로부터 접근이 통제된 구역에 시스템을 설치하고 기술적/물리적으로 감시 및 차단하고 있습니다.</p>
        </li>
        <li>
            <p>개인정보의 암호화: 이용자의 개인정보는 비밀번호는 암호화되어 저장 및 관리되고 있어, 본인만이 알 수 있으며 중요한 데이터는 파일 및 전송 데이터를 암호화하거나 파일 잠금 기능을 사용하는 등의 별도 보안기능을 사용하고 있습니다.</p>
        </li>
        <li>
            <p>접속기록의 보관 및 위변조 방지: 개인정보처리시스템에 접속한 기록을 최소 6개월 이상 보관, 관리하고 있으며, 접속 기록이 위변조 및 도난, 분실되지 않도록 보안기능 사용하고 있습니다.</p>
        </li>
        <li>
            <p>개인정보에 대한 접근 제한: 개인정보를 처리하는 데이터베이스시스템에 대한 접근권한의 부여 ,변경, 말소를 통하여 개인정보에 대한 접근통제를 위하여 필요한 조치를 하고 있으며 침입차단시스템을 이용하여 외부로부터의 무단 접근을 통제하고 있습니다.</p>
        </li>
        <li>
            <p>문서보안을 위한 잠금장치 사용: 개인정보가 포함된 서류, 보조저장매체 등을 잠금장치가 있는 안전한 장소에 보관하고 있습니다.</p>
        </li>
        <li>
            <p>비인가자에 대한 출입 통제: 개인정보를 보관하고 있는 물리적 보관 장소를 별도로 두고 이에 대해 출입통제 절차를 수립, 운영하고 있습니다.</p>
        </li>
        <li>
            <p><strong>개인정보의 취급 위탁</strong></p>
        </li>
    </ol>
    <p>회사는 서비스 이행을 위해 아래와 같이 외부 전문업체에 위탁하여 운영하고 있으며, 관계 법령에 따라 위탁 계약 시 개인정보가 안전하게 관리될 수 있도록 필요한 사항을 규정하고 있습니다. 회사의 개인정보 위탁처리 기관 및 위탁업무 내용은 아래와 같습니다.</p>
    <ul>
        <li>수탁자 : Amazon Web Service In, ATLAS</li>
        <li>위탁업무 : 데이터 보관 및 처리</li>
        <li>보유 및 이용기간: 회원탈퇴 시 혹은 위탁계약종료시까지</li>
    </ul>
  `;

    res.status(200).json({ success: true, data: html });
  } catch (error) {
    next(error);
  }
};

export const getPolicy = (req, res, next) => {
  try {
    const html = `
    
      <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:center;line-height:107%;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:19px;line-height:107%;">이용약관</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:24px;font-family:굴림;">제1장 총칙</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제1조&nbsp;(목적)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">이 약관은 어플&nbsp;&lt;보고보고&gt;(이하&nbsp;&lsquo;회사&rsquo;라고 합니다)가 모바일 기기를 통해 제공하는 모바일 어플리케이션 서비스 및 이에 부수하는 네트워크,&nbsp;웹사이트,&nbsp;기타 서비스(이하&nbsp;&ldquo;서비스&rdquo;라 합니다)의 이용에 대한 회사와 서비스 이용자의 권리ㆍ의무 및 책임사항,&nbsp;기타 필요한 사항을 규정함을 목적으로 합니다</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제2조&nbsp;(용어의 정의)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">①&nbsp;</span><span style="font-size:16px;font-family:굴림;">이 약관에서 사용하는 용어의 정의는 다음과 같습니다.</span></p>
    <ul style="margin-bottom:0cm;" type="disc">
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:     굴림;">&ldquo;</span><span style="font-size:16px;font-family:굴림;">회사&rdquo;-&nbsp;모바일 기기를 통하여 서비스를 제공하는 사업자</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:     굴림;">&ldquo;</span><span style="font-size:16px;font-family:굴림;">회원&rdquo;-&nbsp;본 약관에 따라 이용계약을 체결하고,&nbsp;회사가 제공하는 서비스를 이용하는 자</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:     굴림;">&ldquo;</span><span style="font-size:16px;font-family:굴림;">모바일 기기&rdquo; -&nbsp;콘텐츠를 다운로드 받거나 설치하여 사용할 수 있는 기기로서,&nbsp;휴대폰,&nbsp;스마트폰,&nbsp;휴대정보단말기(PDA),&nbsp;태블릿 등의 기기</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:     굴림;">&ldquo;</span><span style="font-size:16px;font-family:굴림;">계정정보&rdquo; -&nbsp;회원의 회원번호와 외부계정정보,&nbsp;기기정보,&nbsp;별명,&nbsp;애플리케이션 내 이용 정보 등을 통칭하는 말</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:     굴림;">&ldquo;</span><span style="font-size:16px;font-family:굴림;">콘텐츠&rdquo; -&nbsp;모바일 기기로 이용할 수 있도록 회사가 서비스 제공과 관련하여 디지털 방식으로 제작한 유료 또는 무료의 내용물 일체(애플리케이션,&nbsp;웹 서비스 등)</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:     굴림;">&ldquo;</span><span style="font-size:16px;font-family:굴림;">애플리케이션&rdquo;이란 회사가 제공하는 서비스를 이용하기 위하여 모바일 기기를 통해 다운로드 받거나 설치하여 사용하는 프로그램 일체</span></li>
    </ul>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">②&nbsp;</span><span style="font-size:16px;font-family:굴림;">이 약관에서 사용하는 용어의 정의는 본 조 제1항에서 정하는 것을 제외하고는 관계법령 및 서비스별 정책에서 정하는 바에 의하며,&nbsp;이에 정하지 아니한 것은 일반적인 상관례에 따릅니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제3조&nbsp;(회사정보 등의 제공)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">회사는 다음 각 호의 사항을 회원이 알아보기 쉽도록 서비스 내에 표시합니다.&nbsp;다만,&nbsp;개인정보처리방침과 약관은 회원이 연결화면을 통하여 볼 수 있도록 할 수 있습니다.</span></p>
    <ul style="margin-bottom:0cm;" type="disc">
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">상호 및 대표자의 성명&nbsp;: Curiosuer (대표자:이예림)</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">연락처&nbsp;:&nbsp;</span><a href="mailto:curiouser2021@gmail.com"><span style="font-size:16px;font-family:굴림;color:blue;">curiouser2021@gmail.com</span></a></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">개인정보처리방침</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">서비스 이용약관</span></li>
    </ul>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제4조&nbsp;(약관의 효력 및 변경)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">①&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 이 약관의 내용을 회원이 알 수 있도록 서비스 내 또는 그 연결화면에 게시합니다.&nbsp;이 경우 이 약관의 내용 중 서비스 중단,&nbsp;청약철회,&nbsp;환급,&nbsp;계약의 해제 내지 해지,&nbsp;회사의 면책사항 등과 같은 중요한 내용은 굵은 글씨,&nbsp;색채,&nbsp;부호 등으로 명확하게 표시하거나 별도의 연결화면 등을 통하여 회원이 알아보기 쉽게 처리합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">②&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사가 약관을 개정할 경우에는 적용일자 및 개정내용,&nbsp;개정사유 등을 명시하여 최소한 그 적용일&nbsp;7일 이전부터 서비스 내 또는 그 연결화면에 게시하여 회원에게 공지합니다.&nbsp;다만,&nbsp;변경된 내용이 회원에게 불리하거나 중대한 사항의 변경인 경우에는 그 적용일&nbsp;30일 이전까지 본문과 같은 방법으로 공지하고 제27조 제1항의 방법으로 회원에게 통지합니다.&nbsp;이 경우 개정 전 내용과 개정 후 내용을 명확하게 비교하여 회원이 알기 쉽도록 표시합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">③&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사가 약관을 개정할 경우 개정약관 공지 후 개정약관의 적용에 대한 회원의 동의 여부를 확인합니다.&nbsp;회사는 제2항의 공지 또는 통지를 할 경우 회원이 개정약관에 대해 동의 또는 거부의 의사표시를 하지 않으면 동의한 것으로 볼 수 있다는 내용도 함께 공지 또는 통지를 하며,&nbsp;회원이 이 약관 시행일까지 거부의 의사표시를 하지 않는다면 개정약관에 동의한 것으로 볼 수 있습니다.&nbsp;회원이 개정약관에 대해 동의하지 않는 경우 회사 또는 회원은 서비스 이용계약을 해지할 수 있으며,&nbsp;개정된 약관에 대한 정보를 알지 못해 발생하는 회원의 피해는 회사가 책임지지 않습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">④&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 회원이 회사와 이 약관의 내용에 관하여 질의 및 응답을 할 수 있도록 조치를 취합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">⑤&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 「전자상거래 등에서의 소비자보호에 관한 법률」,&nbsp;「약관의 규제에 관한 법률」,&nbsp;「정보통신망이용촉진 및 정보보호 등에 관한 법률」,&nbsp;「콘텐츠산업진흥법」 등 관련 법령에 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제5조&nbsp;(이용계약의 체결 및 적용)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">①&nbsp;</span><span style="font-size:16px;font-family:굴림;">이용계약은 회원이 되고자 하는 자(이하&nbsp;&ldquo;가입신청자&rdquo;라 합니다.)가 이 약관의 내용에 대하여 동의를 한 다음 서비스 이용 신청을 하고,&nbsp;회사가 그 신청에 대해서 승낙함으로써 체결됩니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">②&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 가입신청자의 신청에 대하여 승낙함을 원칙으로 합니다.&nbsp;다만,&nbsp;회사는 회사의 판단 하에 다음 각 호의 어느 하나에 해당하는 이용 신청에 대해서는 승낙을 거절할 수 있습니다.</span></p>
    <ul style="margin-bottom:0cm;" type="disc">
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">이용신청서 내용을 허위로 기재하거나 이용신청 요건을 충족하지 못한 경우</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">회사가 서비스를 제공하지 않은 국가에서 비정상적이거나 우회적인 방법을 통해 서비스를 이용하는 경우</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">사회의 안녕과 질서 또는 미풍양속을 저해할 목적으로 신청한 경우</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">부정한 용도로 서비스를 이용하고자 하는 경우</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">영리를 추구할 목적으로 서비스를 이용하고자 하는 경우</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">그 밖에 위 각 호에 준하는 사유로서 승낙이 부적절하다고 판단되는 경우</span></li>
    </ul>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">③&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 다음 각 호의 어느 하나에 해당하는 경우 그 사유가 해소될 때까지 승낙을 유보할 수 있습니다.</span></p>
    <ul style="margin-bottom:0cm;" type="disc">
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">회사의 설비에 여유가 없거나,&nbsp;특정 모바일 기기의 지원이 어렵거나,&nbsp;기술적 장애가 있는 경우</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">서비스 상의 장애 또는 서비스 이용요금,&nbsp;결제수단의 장애가 발생한 경우</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">그 밖의 위 각 호에 준하는 사유로서 이용신청의 승낙이 어렵다고 판단되는 경우</span></li>
    </ul>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제6조&nbsp;(약관 외 준칙)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">이 약관에서 정하지 아니한 사항과 이 약관의 해석에 관하여는 「전자상거래 등에서의 소비자보호에 관한 법률」,「약관의 규제에 관한 법률」,「정보통신망이용촉진 및 정보보호 등에 관한 법률」,「콘텐츠산업진흥법」 등 관련 법령 또는 상관례에 따릅니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제7조&nbsp;(운영정책)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">①&nbsp;</span><span style="font-size:16px;font-family:굴림;">약관을 적용하기 위하여 필요한 사항과 약관에서 구체적 범위를 정하여 위임한 사항을 서비스 운영정책(이하&nbsp;&ldquo;운영정책&rdquo;이라 합니다)으로 정할 수 있습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">②&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 운영정책의 내용을 회원이 알 수 있도록 서비스 내 또는 그 연결화면에 게시합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">③&nbsp;</span><span style="font-size:16px;font-family:굴림;">운영정책을 개정하는 경우에는 제4조 제2항의 절차에 따릅니다.&nbsp;다만,&nbsp;운영정책 개정내용이 다음 각 호의 어느 하나에 해당하는 경우에는 본 조 제2항의 방법으로 사전에 공지합니다.</span></p>
    <ul style="margin-bottom:0cm;" type="disc">
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">약관에서 구체적으로 범위를 정하여 위임한 사항을 개정하는 경우</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">회원의 권리&middot;의무와 관련 없는 사항을 개정하는 경우</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">운영정책의 내용이 약관에서 정한 내용과 근본적으로 다르지 않고 회원이 예측할 수 있는 범위 내에서 운영정책을 개정하는 경우</span></li>
    </ul>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:24px;font-family:굴림;">제2장 개인정보 관리</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제8조&nbsp;(개인정보의 보호 및 사용)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">①&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 관련 법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해 최선의 노력을 다하며,&nbsp;개인정보의 보호 및 사용에 대해서는 관련 법령 및 회사의 개인정보처리방침에 따릅니다.&nbsp;다만,&nbsp;회사가 제공하는 서비스 이외의 링크된 서비스에서는 회사의 개인정보처리방침이 적용되지 않습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">②&nbsp;</span><span style="font-size:16px;font-family:굴림;">서비스의 특성에 따라 회원의 개인정보와 관련이 없는 닉네임 및 회원 등급 등 자신을 소개하는 내용이 공개될 수 있습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">③&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 관련 법령에 의해 관련 국가기관 등의 요청이 있는 경우를 제외하고는 회원의 개인정보를 본인의 동의 없이 타인에게 제공하지 않습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">④&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 회원의 귀책사유로 개인정보가 유출되어 발생한 피해(본인 및 제3자 피해 포함)에 대하여 책임을 지지 않습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:24px;font-family:굴림;">제3장 이용계약 당사자의 의무</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제9조&nbsp;(회사의 의무)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">①&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 관련 법령,&nbsp;이 약관에서 정하는 권리의 행사 및 의무의 이행을 신의에 따라 성실하게 준수합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">②&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 회원이 안전하게 서비스를 이용할 수 있도록 개인정보(신용정보 포함)보호를 위해 보안시스템을 갖추어야 하며 개인정보처리방침을 공시하고 준수합니다.&nbsp;회사는 이 약관 및 개인정보처리방침에서 정한 경우를 제외하고는 회원의 개인정보가 제3자에게 공개 또는 제공되지 않도록 합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">③&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 계속적이고 안정적인 서비스의 제공을 위하여 서비스 개선을 하던 중 설비에 장애가 생기거나 데이터 등이 멸실</span><span style='font-size:16px;font-family:"MS Gothic";'>,&nbsp;</span><span style="font-size:16px;font-family:굴림;">훼손된 때에는 천재지변,&nbsp;비상사태,&nbsp;현재의 기술로는 해결이 불가능한 장애나 결함 등 부득이한 사유가 없는 한 지체 없이 이를 수리 또는 복구하도록 최선의 노력을 다합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제10조&nbsp;(회원의 의무)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">①&nbsp;</span><strong><span style="font-size:16px;font-family:굴림;">회원은 회사에서 제공하는 서비스의 이용과 관련하여 다음 각 호에 해당하는 행위를 해서는 안 됩니다.</span></strong></p>
    <ul style="margin-bottom:0cm;" type="disc">
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">이용신청 또는 회원 정보 변경 시 허위사실을 기재하는 행위</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">회사의 직원이나 운영자를 가장하거나 타인의 명의를 도용하여 글을 게시하거나 메일을 발송하는 행위,&nbsp;타인으로 가장하거나 타인과의 관계를 허위로 명시하는 행위</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">다른 회원의&nbsp;ID&nbsp;및 비밀번호를 부정사용하는 행위</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">다른 회원의 개인정보를 무단으로 수집</span><span style='font-size:16px;font-family:"MS Gothic";'>&sdot;</span><span style="font-size:16px;font-family:     굴림;">저장</span><span style='font-size:16px;font-family:"MS Gothic";'>&sdot;</span><span style="font-size:16px;font-family:     굴림;">게시 또는 유포하는 행위</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">도박 등 사행행위를 하거나 유도하는 행위,&nbsp;음란</span><span style='font-size:16px;font-family:     "MS Gothic";'>&sdot;</span><span style="font-size:16px;font-family:굴림;">저속한 정보를 교류</span><span style='font-size:16px;font-family:"MS Gothic";'>&sdot;</span><span style="font-size:16px;font-family:굴림;">게재하거나 음란 사이트를 연결(링크)하는 행위,&nbsp;수치심</span><span style='font-size:16px;font-family:"MS Gothic";'>&sdot;</span><span style="font-size:16px;font-family:굴림;">혐오감 또는 공포심을 일으키는 말</span><span style='font-size:16px;font-family:"MS Gothic";'>&sdot;</span><span style="font-size:16px;font-family:     굴림;">소리</span><span style='font-size:16px;font-family:"MS Gothic";'>&sdot;</span><span style="font-size:16px;font-family:     굴림;">글</span><span style='font-size:16px;font-family:"MS Gothic";'>&sdot;</span><span style="font-size:16px;font-family:     굴림;">그림</span><span style='font-size:16px;font-family:"MS Gothic";'>&sdot;</span><span style="font-size:16px;font-family:     굴림;">사진 또는 영상을 타인에게 전송 또는 유포하는 행위 등 서비스를 불건전하게 이용하는 행위</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">서비스를 무단으로 영리,&nbsp;영업,&nbsp;광고,&nbsp;홍보,&nbsp;정치활동,&nbsp;선거운동 등 본래의 용도 이외의 용도로 이용하는 행위</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">회사의 서비스를 이용하여 얻은 정보를 무단으로 복제</span><span style='font-size:16px;font-family:"MS Gothic";'>․</span><span style="font-size:16px;font-family:     굴림;">유통</span><span style='font-size:16px;font-family:"MS Gothic";'>․</span><span style="font-size:16px;font-family:     굴림;">조장하거나 상업적으로 이용하는 행위,&nbsp;알려지거나 알려지지 않은 버그를 악용하여 서비스를 이용하는 행위</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">타인을 기망하여 이득을 취하는 행위,&nbsp;회사의 서비스의 이용과 관련하여 타인에게 피해를 입히는 행위</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">회사나 타인의 지적재산권 또는 초상권을 침해하는 행위,&nbsp;타인의 명예를 훼손하거나 손해를 가하는 행위</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">법령에 의하여 전송 또는 게시가 금지된 정보(컴퓨터 프로그램)나 컴퓨터 소프트웨어</span><span style='font-size:16px;font-family:"MS Gothic";'>&sdot;</span><span style="font-size:16px;font-family:     굴림;">하드웨어 또는 전기통신장비의 정상적인 작동을 방해</span><span style='font-size:16px;font-family:"MS Gothic";'>&sdot;</span><span style="font-size:16px;font-family:     굴림;">파괴할 목적으로 고안된 바이러스</span><span style='font-size:16px;font-family:"MS Gothic";'>&sdot;</span><span style="font-size:16px;font-family:     굴림;">컴퓨터 코드</span><span style='font-size:16px;font-family:"MS Gothic";'>&sdot;</span><span style="font-size:16px;font-family:     굴림;">파일</span><span style='font-size:16px;font-family:"MS Gothic";'>&sdot;</span><span style="font-size:16px;font-family:     굴림;">프로그램 등을 고의로 전송</span><span style='font-size:16px;font-family:"MS Gothic";'>&sdot;</span><span style="font-size:16px;font-family:     굴림;">게시</span><span style='font-size:16px;font-family:"MS Gothic";'>&sdot;</span><span style="font-size:16px;font-family:     굴림;">유포 또는 사용하는 행위</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">회사로부터 특별한 권리를 부여 받지 않고 애플리케이션을 변경하거나,&nbsp;애플리케이션에 다른 프로그램을 추가</span><span style='font-size:16px;font-family:"MS Gothic";'>&sdot;</span><span style="font-size:16px;font-family:     굴림;">삽입하거나,&nbsp;서버를 해킹</span><span style='font-size:16px;font-family:"MS Gothic";'>&sdot;</span><span style="font-size:16px;font-family:굴림;">역설계하거나,&nbsp;소스 코드나 애플리케이션 데이터를 유출</span><span style='font-size:16px;font-family:"MS Gothic";'>&sdot;</span><span style="font-size:16px;font-family:     굴림;">변경하거나,&nbsp;별도의 서버를 구축하거나,&nbsp;웹사이트의 일부분을 임의로 변경</span><span style='font-size:16px;font-family:"MS Gothic";'>&sdot;</span><span style="font-size:16px;font-family:     굴림;">도용하여 회사를 사칭하는 행위</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">그 밖에 관련 법령에 위반되거나 선량한 풍속 기타 사회통념에 반하는 행위</span></li>
    </ul>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">②&nbsp;</span><span style="font-size:16px;font-family:굴림;">회원의 계정 및 모바일 기기에 관한 관리 책임은 회원에게 있으며,&nbsp;이를 타인이 이용하도록 하게 하여서는 안 됩니다.&nbsp;<strong>모바일 기기의 관리 부실이나 타인에게 이용을 승낙함으로 인해 발생하는 손해에 대해서 회사는 책임을 지지 않습니다.</strong></span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">③&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 다음 각 호의 행위의 구체적인 내용을 정할 수 있으며,&nbsp;회원은 이를 따라야 합니다.</span></p>
    <ul style="margin-bottom:0cm;" type="disc">
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">회원의 계정명</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">채팅내용과 방법</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">게시판이용 및 서비스이용 방법</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">페이스북,&nbsp;애플 등 외부 모바일 플랫폼 제휴 서비스 정책</span></li>
    </ul>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:16px;font-family:굴림;">이 파트는 어떤 내용이 들어가야 하는 부분일까요?&nbsp;구체적인 내용이란 어떤 것들을 말하는지 궁금합니다!</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:24px;font-family:굴림;">제4장 서비스 이용 및 이용제한</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제11조&nbsp;(서비스의 제공)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">①&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 제5조의 규정에 따라 이용계약이 완료된 회원에게 그 즉시 서비스를 이용할 수 있도록 합니다.&nbsp;다만,&nbsp;일부 서비스의 경우 회사의 필요에 따라 지정된 일자부터 서비스를 개시할 수 있습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">②&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 회원에게 서비스를 제공할 때 이 약관에 정하고 있는 서비스를 포함하여 기타 부가적인 서비스를 함께 제공할 수 있습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">③&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 회원의 등급을 구분하고 이용시간,&nbsp;이용횟수,&nbsp;제공 서비스의 범위 등을 세분화하여 이용에 차등을 둘 수 있습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제12조&nbsp;(서비스의 이용)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">①&nbsp;</span><span style="font-size:16px;font-family:굴림;">서비스는 회사의 영업방침에 따라 정해진 시간 동안 제공합니다.&nbsp;회사는 서비스 제공시간을 애플리케이션 초기화면이나 서비스 공지사항에 적절한 방법으로 안내합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">②&nbsp;</span><span style="font-size:16px;font-family:굴림;">제1항에도 불구하고 회사는 다음 각 호의 경우에는 서비스의 전부 또는 일부를 일시 정지할 수 있습니다.&nbsp;이 경우 회사는 사전에 그 정지의 사유와 기간을 애플리케이션 초기화면이나 서비스 공지사항 등에 공지합니다.&nbsp;다만,&nbsp;사전에 공지할 수 없는 부득이한 사정이 있는 경우 사후에 공지할 수 있습니다.</span></p>
    <ul style="margin-bottom:0cm;" type="disc">
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">시스템 정기점검,&nbsp;서버의 증설 및 교체,&nbsp;네트워크의 불안정 등의 시스템 운영상 필요한 경우</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">정전,&nbsp;서비스 설비의 장애,&nbsp;서비스 이용폭주,&nbsp;기간통신사업자의 설비 보수 또는 점검 등으로 인하여 정상적인 서비스 제공이 불가능한 경우</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">전시,&nbsp;사변,&nbsp;천재지변 또는 이에 준하는 국가비상사태 등 회사가 통제할 수 없는 상황이 발생한 경우</span></li>
    </ul>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">③&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 모바일 기기를 위한 전용 애플리케이션 또는 네트워크를 이용하여 서비스를 제공합니다.&nbsp;회원은 애플리케이션을 다운로드하여 설치하거나 네트워크를 이용하여 무료 또는 유료로 서비스를 이용할 수 있습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">④&nbsp;</span><span style="font-size:16px;font-family:굴림;">다운로드하여 설치한 애플리케이션 또는 네트워크를 통해 이용하는 서비스의 경우에는 모바일 기기 또는 이동통신사의 특성에 맞도록 제공됩니다.&nbsp;모바일 기기의 변경</span><span style='font-size:16px;font-family:"MS Gothic";'>․</span><span style="font-size:16px;font-family:굴림;">번호 변경 또는 해외 로밍의 경우에는 콘텐츠의 전부 또는 일부의 이용이 불가능할 수 있으며,&nbsp;이로 인해 발생된 피해 내지 손해는 회사가 책임을 지지 않습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">⑤&nbsp;</span><span style="font-size:16px;font-family:굴림;">다운로드하여 설치한 애플리케이션 또는 네트워크를 통해 이용하는 서비스의 경우에는 백그라운드 작업이 진행될 수 있습니다.&nbsp;이 경우 모바일 기기 또는 이동통신사의 특성에 맞도록 추가요금이 발생할 수 있으며 이로 인해 발생된 피해 내지 손해는 회사는 책임을 지지 않습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제13조&nbsp;(서비스의 변경 및 중단)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">①&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 원활한 서비스 제공을 위해 운영상 또는 기술상의 필요에 따라 서비스를 변경할 수 있으며,&nbsp;변경 전에 해당 내용을 서비스 내에 공지합니다.&nbsp;다만,&nbsp;버그</span><span style='font-size:16px;font-family:"MS Gothic";'>․</span><span style="font-size:16px;font-family:굴림;">오류 등의 수정이나 긴급 업데이트 등 부득이하게 변경할 필요가 있는 경우 또는 중대한 변경에 해당하지 않는 경우에는 사후에 공지할 수 있습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">②&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 영업양도</span><span style='font-size:16px;font-family:"MS Gothic";'>,&nbsp;</span><span style="font-size:16px;font-family:굴림;">분할</span><span style='font-size:16px;font-family:"MS Gothic";'>,&nbsp;</span><span style="font-size:16px;font-family:굴림;">합병 등에 따른 영업의 폐지,&nbsp;계약만료,&nbsp;당해 서비스의 현저한 수익 악화 등 경영상의 중대한 사유로 인해 서비스를 지속하기 어려운 경우에는 서비스 전부를 중단할 수 있습니다.&nbsp;이 경우 중단일자&nbsp;30일 이전까지 중단일자</span><span style='font-size:16px;font-family:"MS Gothic";'>․</span><span style="font-size:16px;font-family:굴림;">중단사유</span><span style='font-size:16px;font-family:"MS Gothic";'>․</span><span style="font-size:16px;font-family:굴림;">보상조건 등을 애플리케이션 초기화면 또는 그 연결화면을 통해 공지하고 제27조 제1항의 방법으로 회원에게 통지합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제14조&nbsp;(정보의 수집 등)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">①&nbsp;</span><s><span style="font-size:16px;font-family:굴림;">회사는 회원간에 이루어지는 채팅 내용을 저장 정보는 회사만이 보유합니다.&nbsp;회사는 회원간의 분쟁 조정,&nbsp;민원 처리 또는 서비스 질서의 유지를 위한 경우에 한하여,&nbsp;제3자는 법령에 따라 권한이 부여된 경우에 한하여 이 정보를 열람할 수 있습니다.</span></s><span style="font-size:16px;font-family:굴림;">&nbsp;<strong>(</strong></span><strong><span style="font-size:16px;font-family:굴림;background:yellow;">별도 채팅 기능이 존재하지 않으면 삭제되어도 되나요?&nbsp;</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:16px;font-family:굴림;background:yellow;">A:&nbsp;</span></strong><strong><span style="font-size:16px;font-family:굴림;background:yellow;">네 현재 약관에서 삭제하셔도 될 것으로 보이고,&nbsp;향후 채팅 기능이 생긴다면 그때 약관 개정하여 본 내용 추가하면 될 것 같습니다</span></strong><strong><span style="font-size:16px;font-family:굴림;">)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">②&nbsp;</span><s><span style="font-size:16px;font-family:굴림;">회사 또는 제3자가 제1항에 따라 채팅 정보를 열람할 경우 회사는 사전에 열람의 사유 및 범위를 해당 회원에게 고지합니다.&nbsp;다만,&nbsp;제10조 제1항에 따른 금지행위의 조사</span></s><s><span style='font-size:16px;font-family:"MS Gothic";'>․</span></s><s><span style="font-size:16px;font-family:굴림;">처리</span></s><s><span style='font-size:16px;font-family:"MS Gothic";'>․</span></s><s><span style="font-size:16px;font-family:굴림;">확인 또는 그 행위로 인한 피해 구제와 관련하여 이 정보를 열람해야 할 경우에는 사후에 고지할 수 있습니다.</span></s></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">③&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 서비스의 원활하고 안정적인 운영 및 서비스 품질의 개선을 위하여 회원의 개인정보를 제외한 회원의 모바일 기기 정보(설정,사양,운영체제,&nbsp;버전 등)를 수집&nbsp;</span><span style='font-size:16px;font-family:"MS Gothic";'>‧</span><span style="font-size:16px;font-family:굴림;">&nbsp;활용할 수 있습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">④&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 서비스 개선 및 회원 대상 서비스 소개 등을 위한 목적으로 회원에게 추가정보를 요청할 수 있습니다.&nbsp;이 요청에 대해 회원은 승낙하거나 거절할 수 있으며,&nbsp;회사가 이 요청을 할 경우에는 회원이 이 요청을 거절할 수 있다는 뜻을 함께 고지합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제15조&nbsp;(광고의 제공)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">①&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 서비스의 운영과 관련하여 서비스 내에 광고를 게재할 수 있습니다.&nbsp;또한 수신에 동의한 회원에 한하여 전자우편,&nbsp;문자서비스(LMS/SMS),&nbsp;푸시메시지(Push Notification)&nbsp;등의 방법으로 광고성 정보를 전송할 수 있습니다.&nbsp;이 경우 회원은 언제든지 수신을 거절할 수 있으며,&nbsp;회사는 회원의 수신 거절 시 광고성 정보를 발송하지 아니합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">②&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사가 제공하는 서비스 중의 배너 또는 링크 등을 통해 타인이 제공하는 광고나 서비스에 연결될 수 있습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">③&nbsp;</span><span style="font-size:16px;font-family:굴림;">제2항에 따라 타인이 제공하는 광고나 서비스에 연결될 경우 해당 영역에서 제공하는 서비스는 회사의 서비스 영역이 아니므로 회사가 신뢰성,&nbsp;안정성 등을 보장하지 않으며,&nbsp;그로 인한 회원의 손해에 대하여도 회사는 책임을 지지 않습니다.&nbsp;다만,&nbsp;회사가 고의 또는 중과실로 손해의 발생을 용이하게 하거나 손해 방지를 위한 조치를 취하지 아니한 경우에는 그러하지 아니합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제16조&nbsp;(지식재산권 등의 귀속)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">①&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사가 제작한 서비스 내의 콘텐츠에 대한 저작권과 기타 지식재산권은 회사에 귀속합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">②&nbsp;</span><span style="font-size:16px;font-family:굴림;">회원은 회사가 제공하는 서비스를 이용하여 얻은 정보 중에서 회사 또는 제공업체에 지식재산권이 귀속된 정보를 회사 또는 제공업체의 사전 동의 없이 복제</span><span style='font-size:16px;font-family:"MS Gothic";'>&sdot;</span><span style="font-size:16px;font-family:굴림;">전송 등의 방법(편집,&nbsp;공표,&nbsp;공연,&nbsp;배포,&nbsp;방송, 2차적 저작물 작성 등을 포함합니다.&nbsp;이하 같습니다)에 의하여 영리목적으로 이용하거나 타인에게 이용하게 하여서는 안 됩니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">③&nbsp;</span><span style="font-size:16px;font-family:굴림;">회원은 서비스 내에서 보여지거나 서비스와 관련하여 회원 또는 다른 이용자가 애플리케이션 또는 서비스를 통해 업로드 또는 전송하는 대화 텍스트를 포함한 커뮤니케이션,&nbsp;이미지,&nbsp;사운드 및 모든 자료 및 정보(이하&nbsp;&ldquo;이용자 콘텐츠&rdquo;라 합니다.)에 대하여 회사가 다음과 같은 방법과 조건으로 이용하는 것을 허락합니다.</span></p>
    <ul style="margin-bottom:0cm;" type="disc">
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">해당 이용자 콘텐츠를 이용,&nbsp;편집 형식의 변경 및 기타 변형하는 것(공표,&nbsp;복제,&nbsp;공연,&nbsp;전송,&nbsp;배포,&nbsp;방송, 2차적 저작물 작성 등 어떠한 형태로든 이용 가능하며,&nbsp;이용기간과 지역에는 제한이 없음)</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">이용자 콘텐츠를 제작한 이용자의 사전 동의 없이 거래를 목적으로 이용자 콘텐츠를 판매,&nbsp;대여,&nbsp;양도 행위를 하지 않음</span></li>
    </ul>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">④&nbsp;</span><span style="font-size:16px;font-family:굴림;">서비스 내에서 보여지지 않고 서비스와 일체화되지 않은 회원의 이용자 콘텐츠(예컨대,&nbsp;일반게시판 등에서의 게시물)에 대하여 회사는 회원의 명시적인 동의가 없이 이용하지 않으며,&nbsp;회원은 언제든지 이러한 이용자 콘텐츠를 삭제할 수 있습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">⑤&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 회원이 게시하거나 등록하는 서비스 내의 게시물에 대해 제10조 제1항에 따른 금지행위에 해당된다고 판단되는 경우에는 사전 통지 없이 이를 삭제 또는 이동하거나 그 등록을 거절할 수 있습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">⑥&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사가 운영하는 게시판 등에 게시된 정보로 인하여 법률상 이익이 침해된 회원은 회사에 해당 정보의 삭제 또는 반박 내용의 게재를 요청할 수 있습니다.&nbsp;이 경우 회사는 신속하게 필요한 조치를 취하고 이를 신청인에게 통지합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">⑦&nbsp;</span><span style="font-size:16px;font-family:굴림;">본 조는 회사가 서비스를 운영하는 동안 유효하며,&nbsp;회원 탈퇴 후에도 지속적으로 적용됩니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;background:yellow;">특정 플랫폼에서 가져온 거라&nbsp;17조가 빠져있는데...&nbsp;혹시 이 항목을 알 수 있을까요!?&nbsp;회사마다 전체 내용 및 순서 등이 조금씩 달라 삭제한 제17조 내용이 무엇일지는 파악이 힘들 것 같습니다.&nbsp;전체적으로 본 약관 정도의 내용으로 특별히 더 추가해야 할 조항은 없어도 될 것으로 보입니다</span><span style="font-size:16px;font-family:굴림;">(</span><span style="font-size:16px;font-family:굴림;">이하 아래 제17조부터 다시 조 번호를 수정하였습니다.)</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제17조&nbsp;(회원에 대한 서비스 이용제한)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">①&nbsp;</span><span style="font-size:16px;font-family:굴림;">회원은 제10조에 따른 회원의 의무를 위반하는 행위를 하여서는 안 되며,&nbsp;해당 행위를 하는 경우에 회사는 다음 각 호의 구분에 따른 회원의 서비스 이용제한,&nbsp;관련 정보(글,&nbsp;사진,&nbsp;영상 등)&nbsp;삭제 및 기타의 조치를 포함한 이용제한 조치를 할 수 있습니다.&nbsp;이용제한 조치가 이루어지는 구체적인 사유 및 절차는 제18조 제1항에 따라 개별 서비스의 운영정책에서 정합니다.</span></p>
    <ul style="margin-bottom:0cm;" type="disc">
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">일부 권한 제한:&nbsp;일정기간 채팅 등 일정 권한을 제한</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">계정 이용제한:&nbsp;일정기간 또는 영구히 회원 계정의 이용을 제한</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">회원 이용제한:&nbsp;일정기간 또는 영구히 회원의 서비스 이용을 제한</span></li>
    </ul>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">②&nbsp;</span><span style="font-size:16px;font-family:굴림;">제1항의 이용제한이 정당한 경우에 회사는 이용제한으로 인하여 회원이 입은 손해를 배상하지 않습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">③&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 다음 각 호의 사유에 대한 조사가 완료될 때까지 해당 계정의 서비스 이용을 정지할 수 있습니다.</span></p>
    <ul style="margin-bottom:0cm;" type="disc">
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">계정이 해킹 또는 도용당했다는 정당한 신고가 접수된 경우</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">불법프로그램 사용자 또는 작업장 등 위법행위자로 의심되는 경우</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">그 밖에 각 호에 준하는 사유로 서비스 이용의 잠정조치가 필요한 경우</span></li>
    </ul>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제18조&nbsp;(이용제한 조치의 사유와 절차)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">①&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 제17조 제1항에 따른 <span style="background:yellow;">회원에 대한 서비스 이용 제한</span>을 제10조 제1항에 따른 금지행위의 내용,&nbsp;정도,&nbsp;횟수,&nbsp;결과 등을 고려하여 운영정책으로 정합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">②&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사가 제17조 제1항에서 정한 이용제한 조치를 하는 경우에는 다음 각 호의 사항을 회원에게 사전 통지합니다.&nbsp;다만,&nbsp;긴급히 조치할 필요가 있는 경우에는 사후에 통지할 수 있습니다.</span></p>
    <ul style="margin-bottom:0cm;" type="disc">
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">이용제한 조치의 사유</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">이용제한 조치의 유형 및 기간</span></li>
        <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">이용제한 조치에 대한 이의신청 방법</span></li>
    </ul>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제19조&nbsp;(이용제한 조치에 대한 이의신청 절차)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">①&nbsp;</span><span style="font-size:16px;font-family:굴림;">회원이 회사의 이용제한 조치에 불복하고자 할 때에는 이 조치의 통지를 받은 날부터&nbsp;14일 이내에 불복 이유를 기재한 이의 신청서를 서면,&nbsp;전자우편 또는 이에 준하는 방법으로 회사에 제출하여야 합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">②&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 제1항의 이의신청서를 접수한 날부터&nbsp;15일 이내에 불복 이유에 대하여 서면,&nbsp;전자우편 또는 이에 준하는 방법으로 답변합니다.&nbsp;다만,&nbsp;회사는 이 기간 내에 답변이 어려운 경우에는 그 사유와 처리일정을 통지합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">③&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 불복 이유가 타당한 경우에는 이에 따른 조치를 취합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제20조&nbsp;(계약 해지 등)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">①&nbsp;</span><span style="font-size:16px;font-family:굴림;">회원은 언제든지 서비스 이용을 원하지 않는 경우 회원 탈퇴를 통해 이용계약을 해지할 수 있습니다.&nbsp;회원탈퇴로 인해 회원이 서비스 내에서 보유한 이용정보는 모두 삭제되어 복구가 불가능하게 됩니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">②&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 회원이 이 약관 및 그에 따른 운영정책,&nbsp;서비스 정책에서 금지하는 행위를 하는 등 본 계약을 유지할 수 없는 중대한 사유가 있는 경우에는 상당한 기간 전에 최고하고 그 기간을 정하여 서비스 이용을 중지하거나 이용계약을 해지할 수 있습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">③&nbsp;</span><span style="font-size:16px;font-family:굴림;">제1항 및 제2항에 따른 환급 및 손해배상은 별도의 지침에 따라 처리합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">④&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 최근의 서비스 이용일부터 연속하여&nbsp;1년 동안 회사의 서비스를 이용하지 않은 회원(이하&nbsp;&ldquo;휴면계정&rdquo;이라 합니다)의 개인정보를 보호하기 위해 이용계약을 해지하고 회원의 개인정보 파기 등의 조치를 취할 수 있습니다.&nbsp;이 경우 조치일&nbsp;30일 전까지 계약해지,&nbsp;개인정보 파기 등의 조치가 취해진다는 사실 및 파기될 개인정보 등을 회원에게 통지합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:24px;font-family:굴림;">제6장 손해배상 및 면책조항 등</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제21조&nbsp;(손해배상)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">①&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사 또는 회원은 본 약관을 위반하여 상대방에게 손해를 입힌 경우에는 그 손해를 배상할 책임이 있습니다.&nbsp;다만,&nbsp;고의 또는 중대한 과실이 없는 경우에는 그러하지 아니 합니다</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">②&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사가 개별서비스 제공자와 제휴 계약을 맺고 회원에게 개별서비스를 제공하는 경우에 회원이 이 개별서비스 이용약관에 동의를 한 뒤 개별서비스 제공자의 고의 또는 과실로 인해 회원에게 손해가 발생한 경우에 그 손해에 대해서는 개별서비스 제공자가 책임을 집니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제22조&nbsp;(회사의 면책)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">①&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관하여 책임을 지지 않습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">②&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 서비스용 설비의 보수,&nbsp;교체,&nbsp;정기점검,&nbsp;공사 등 기타 이에 준하는 사유로 발생한 손해에 대하여 책임을 지지 않습니다.&nbsp;다만,&nbsp;회사의 고의 또는 중대한 과실에 의한 경우에는 그러하지 아니합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">③&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 회원의 고의 또는 과실로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.&nbsp;다만,&nbsp;회원에게 객관적으로 부득이하거나 정당한 사유가 있는 경우에는 그러하지 아니합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">④&nbsp;</span><span style="font-size:16px;font-family:굴림;">회원이 서비스와 관련하여 게재한 정보나 자료 등의 신뢰성,&nbsp;정확성 등에 대하여 회사는 고의 또는 중대한 과실이 없는 한 책임을 지지 않습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">⑤&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 회원이 다른 회원 또는 타인과 서비스를 매개로 발생한 거래나 분쟁에 대해 개입할 의무가 없으며,&nbsp;이로 인한 손해에 대해 책임을 지지 않습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">⑥&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 무료로 제공되는 서비스 이용과 관련하여 회원에게 발생한 손해에 대해서는 책임을 지지 않습니다.&nbsp;그러나 회사의 고의 또는 중과실에 의한 경우에는 그러하지 아니합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">⑦&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 회원이 서비스를 이용하여 기대하는 이익을 얻지 못하거나 상실한 것에 대하여 책임을 지지 않습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">⑧&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 회원의 서비스상 등급,&nbsp;포인트 등의 손실에 대하여 책임을 지지 않습니다.&nbsp;다만,&nbsp;회사의 고의 또는 중대한 과실에 의한 경우에는 그러하지 아니합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">⑨&nbsp;</span><s><span style="font-size:16px;font-family:굴림;">회사는 회원이 모바일 기기 비밀번호,&nbsp;오픈마켓 사업자가 제공하는 비밀번호 등을 관리하지 않아 발생하는 제3자 결제에 대해 책임을 지지 않습니다.&nbsp;다만,&nbsp;회사의 고의 또는 과실에 의한 경우에는 그러하지 아니합니다.</span></s><span style="font-size:16px;font-family:굴림;">&nbsp;<strong><span style="background:yellow;">(</span></strong></span><strong><span style="font-size:16px;font-family:굴림;background:yellow;">결제 기능이 없음=&nbsp;이부분 역시 없다면 삭제해도 무방하나 유지하여도 회사에 별다른 손해는 없을 것으로 보임)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">⑩&nbsp;</span><span style="font-size:16px;font-family:굴림;">회원이 모바일 기기의 변경,&nbsp;모바일 기기의 번호 변경,&nbsp;운영체제(OS)&nbsp;버전의 변경,&nbsp;해외 로밍,&nbsp;통신사 변경 등으로 인해 콘텐츠 전부나 일부의 기능을 이용할 수 없는 경우 회사는 이에 대해 책임을 지지 않습니다.&nbsp;다만,&nbsp;회사의 고의 또는 과실에 의한 경우에는 그러하지 아니합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">⑪&nbsp;</span><span style="font-size:16px;font-family:굴림;">회원이 회사가 제공하는 콘텐츠나 계정정보를 삭제한 경우 회사는 이에 대해 책임을 지지 않습니다.&nbsp;다만,&nbsp;회사의 고의 또는 중대한 과실에 의한 경우에는 그러하지 아니합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">⑫&nbsp;</span><s><span style="font-size:16px;font-family:굴림;">회사는 임시회원이 서비스 이용으로 발생한 손해에 대해서는 책임을 지지 않습니다.&nbsp;다만,&nbsp;회사의 고의 또는 과실에 의한 경우에는 그러하지 아니합니다.</span></s><span style="font-size:16px;font-family:굴림;">&nbsp;<strong>(</strong></span><strong><span style="font-size:16px;font-family:굴림;">임시회원 절차가 없음=&nbsp;삭제 유지)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제23조&nbsp;(회원에 대한 통지)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">①&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사가 회원에게 통지를 하는 경우 회원의 전자우편주소,&nbsp;전자메모,&nbsp;서비스 내 푸시알림,&nbsp;문자메시지(LMS/SMS)&nbsp;등으로 할 수 있습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">②&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 회원 전체에게 통지를 하는 경우&nbsp;7일 이상 서비스 내에 게시하거나 팝업화면 등을 제시함으로써 제1항의 통지에 갈음할 수 있습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제24조&nbsp;(재판권 및 준거법)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">이 약관은 대한민국 법률에 따라 규율되고 해석됩니다.&nbsp;회사와 회원 간에 발생한 분쟁으로 소송이 제기되는 경우에는 서울중앙지방법원을 제1심 전속적 관할 법원으로 합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><strong><span style="font-size:18px;font-family:굴림;">제25조&nbsp;(회원의 고충처리 및 분쟁해결)</span></strong></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">①&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 회원의 편의를 고려하여 회원의 의견이나 불만을 제시하는 방법을 서비스 내 또는 그 연결화면에 안내합니다.&nbsp;회사는 이러한 회원의 의견이나 불만을 처리하기 위한 전담인력을 운영합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">②&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사는 회원으로부터 제기되는 의견이나 불만이 정당하다고 객관적으로 인정될 경우에는 합리적인 기간 내에 이를 신속하게 처리합니다.&nbsp;다만,&nbsp;처리에 장기간이 소요되는 경우에는 회원에게 장기간이 소요되는 사유와 처리일정을 서비스 내 공지하거나 제23조 제1항에 따라 통지합니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">③&nbsp;</span><span style="font-size:16px;font-family:굴림;">회사와 회원 간에 분쟁이 발생하여 제3의 분쟁조정기관이 조정할 경우 회사는 이용제한 등 회원에게 조치한 사항을 성실히 증명하고,&nbsp;조정기관의 조정에 따를 수 있습니다.</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">부칙</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:left;line-height:normal;font-size:13px;font-family:"맑은 고딕";'><span style="font-size:16px;font-family:굴림;">(</span><span style="font-size:16px;font-family:굴림;">시행일)&nbsp;이 약관은&nbsp;2021년 <span style="background:yellow;">0</span><span style="background:yellow;">월&nbsp;0일부터</span> 시행합니다</span></p>
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;text-align:justify;line-height:107%;font-size:13px;font-family:"맑은 고딕";'>&nbsp;</p>
  `;
    res.status(200).json({ success: true, data: html });
  } catch (error) {
    next(error);
  }
};

export const getNotice = (req, res, next) => {
  try {
    const html = [
      `<p>[공지] 보고보고를 찾아주신 모든 관객 여러분들 환영합니다!&nbsp;</p>
    <p><br></p>
    <p>안녕하세요,&nbsp;</p>
    <p>팀 Curiouser입니다.&nbsp;</p>
    <p><br></p>
    <p>&lt;보고보고&gt;에 찾아와주셔서 진심으로 감사합니다!&nbsp;</p>
    <p><br></p>
    <p>&lt;보고보고&gt;는 관객 여러분들께서 공연에 대한 정보를 누구나 쉽게 찾고 공유하실 수 있는 공간입니다.&nbsp;</p>
    <p><br></p>
    <p>저희는 이 공간을 더욱 가꾸어나갈 예정입니다.&nbsp;</p>
    <p>공연 리뷰를 작성하고 보실 수 있는 공간이자,</p>
    <p>극단들이 관객 여러분들과 소통하실 수 있는 공간이자,</p>
    <p>주변 지역이 함께 성장할 수 있는 기반이 되는 공간으로 만들고자 하는 목표가 있습니다.&nbsp;</p>
    <p><br></p>
    <p>이 공간을 가꾸어 나가는 데에 무엇보다 가장 힘이 되는 것은 이용자 여러분들입니다. 여러분들의 소중한 경험은 또 다른 관객의 선택에 큰 도움이 될 것입니다. 꼬리에 꼬리를 무는 이 도움은 더 많은 사람들이 공연을 사랑할 수밖에 없는 이유가 될 것이라 생각합니다.&nbsp;</p>
    <p><br></p>
    <p>현재는 초반 베타 서비스 기간으로 공연 리뷰와 관련된 서비스를 우선적으로 제공하고 있습니다. 각 분야의 전문가들은 아니지만 지속적으로 양질의 서비스를 제공할 수 있도록 차근차근 노력하겠습니다. 본 어플을 이용하시며 궁금한 점이나 불편한 점, 혹은 피드백이 있으시다면 아래의 창구를 통해 연락 주시면 최대한 빠르고 성실히 답변 드리도록 하겠습니다.&nbsp;</p>
    <p><br></p>
    <p>이 공간의 주인공은 여러분들이니,&nbsp;</p>
    <p>편히 마음껏 즐기고 가실 수 있길 진심으로 희망합니다.</p>
    <p><br></p>
    <p>&bull;contact</p>
    <p>&nbsp; &nbsp;- mail : curiouser2021@gmail.com&nbsp;</p>
    <p>- twitter : @bogobogo_app</p>`,
    ];
    res.status(200).json({ success: true, data: html });
  } catch (error) {
    next(error);
  }
};

// refresh
export const getRefresh = async (req, res, next) => {
  try {
    // access token과 refresh token의 존재 유무를 체크합니다.
    if (req.headers.authorization && req.headers.refresh) {
      const accessToken = req.headers.authorization.split("Bearer ")[1];
      const refreshToken = req.headers.refresh;

      // access token 검증 -> expired여야 함.
      const accessResult = verify(accessToken);

      // access token 디코딩하여 user의 정보를 가져옵니다.
      const decoded = jwt.decode(accessToken);

      // 디코딩 결과가 없으면 권한이 없음을 응답.
      if (decoded === null) {
        return next(throwError(401, "권한이 없습니다."));
      }

      /* access token의 decoding 된 값에서
      유저의 id를 가져와 refresh token을 검증합니다. */
      const refreshResult = await refreshVerify(refreshToken, decoded.id);

      // 재발급을 위해서는 access token이 만료되어 있어야합니다.
      if (
        accessResult.success === false &&
        accessResult.message === "jwt expired"
      ) {
        // 1. access token이 만료되고, refresh token도 만료 된 경우 => 새로 로그인해야합니다.
        if (!refreshResult) {
          return next(throwError(401, "새로 로그인 해주세요."));
        } else {
          // 2. access token이 만료되고, refresh token은 만료되지 않은 경우 => 새로운 access token을 발급
          const newAccessToken = sign(decoded);

          logger.info(`GET /refresh 200 Response: "success: true"`);

          res.status(200).json({
            // 새로 발급한 access token과 원래 있던 refresh token 모두 클라이언트에게 반환합니다.
            success: true,
            data: {
              accessToken: newAccessToken,
            },
          });
        }
      } else {
        // 3. access token이 만료되지 않은경우 => refresh 할 필요가 없습니다.
        return next(throwError(400, "Access Token이 유효합니다."));
      }
    } else {
      // access token 또는 refresh token이 헤더에 없는 경우
      return next(throwError(400, "Access token, refresh token이 필요합니다."));
    }
  } catch (error) {
    next(error);
  }
};

// jwt
export const getJwt = async (req, res, next) => {
  try {
    const { provider } = req.query;

    if (provider !== "apple" && !req.headers.authorization) {
      return next(throwError(400, "header에 accessToken이 없습니다."));
    }

    let AccessToken;
    if (provider !== "apple") {
      AccessToken = req.headers.authorization.split("Bearer ")[1];
    }
    const userObj = {};
    let Tokendata;
    let userData;
    let user;

    switch (provider) {
      case "kakao":
        Tokendata = await tokenApi(
          "https://kapi.kakao.com/v1/user/access_token_info",
          AccessToken
        );
        break;

      case "naver":
        Tokendata = await tokenApi(
          "https://openapi.naver.com/v1/nid/verify",
          AccessToken
        );
        break;

      case "google":
        try {
          Tokendata = await tokenApi(
            `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${AccessToken}`
          );
        } catch (error) {
          next(error);
        }
        break;

      case "facebook":
        try {
          Tokendata = await tokenApi(
            `https://graph.facebook.com/debug_token?
            input_token=${AccessToken}
            &access_token=${FACEBOOK_ID}`
          );
        } catch (error) {
          next(error);
        }
        break;

      case "apple":
        try {
          const { idToken } = req.query;

          const json = jwt.decode(idToken, { complete: true });
          const { kid } = json.header;
          const appleKeys = await getAppleSigningKey(kid);

          if (!appleKeys) {
            console.error("something went wrong");
            return;
          }

          const decoded = jwtDecode(idToken);
          console.log("decoded:", decoded);

          userObj.appleId = decoded.sub;
          user = await userExist(userObj);

          if (!user) {
            user = await User.create({
              nickname: `포도알${parseInt(Math.random() * 100000)}`,
              appleId: decoded.sub,
            });
          }

          // jwt 발급
          const accessToken = sign(user);
          const refreshToken = refresh();

          redisClient.set(user.id, refreshToken);
          logger.info(`GET /jwt 200 Response: "success: true"`);

          return res
            .status(200)
            .json({ success: true, data: { accessToken, refreshToken } });
        } catch (error) {
          next(error);
        }
        break;

      default:
        return next(throwError(400, "잘못된 provider입니다."));
    }

    switch (provider) {
      case "kakao":
        userData = await (
          await tokenApi("https://kapi.kakao.com/v2/user/me", AccessToken)
        ).json();

        userObj.kakaoId = userData.id;
        user = await userExist(userObj);

        if (!user) {
          user = await User.create({
            nickname: `포도알${parseInt(Math.random() * 100000)}`,
            kakaoId: userData.id,
          });
        }
        break;

      case "naver":
        userData = await (
          await tokenApi("https://openapi.naver.com/v1/nid/me", AccessToken)
        ).json();

        userObj.naverId = userData.response.id;
        user = await userExist(userObj);

        if (!user) {
          user = await User.create({
            nickname: `포도알${parseInt(Math.random() * 100000)}`,
            naverId: userData.response.id,
          });
        }
        break;

      case "google":
        try {
          userData = await (
            await tokenApi(
              `https://www.googleapis.com/oauth2/v2/userinfo`,
              AccessToken
            )
          ).json();

          userObj.googleId = userData.id;
          user = await userExist(userObj);

          if (!user) {
            user = await User.create({
              nickname: `포도알${parseInt(Math.random() * 100000)}`,
              googleId: userData.id,
            });
          }
        } catch (error) {
          next(error);
        }
        break;

      case "facebook":
        try {
          userData = await (
            await tokenApi(
              `https://graph.facebook.com/me?access_token=${AccessToken}`
            )
          ).json();

          userObj.facebookId = userData.id;
          user = await userExist(userObj);

          if (!user) {
            user = await User.create({
              nickname: `포도알${parseInt(Math.random() * 100000)}`,
              facebookId: userData.id,
            });
          }
        } catch (error) {
          next(error);
        }
        break;

      default:
        return next(throwError(400, "잘못된 provider입니다."));
    }

    // jwt 발급
    const accessToken = sign(user);
    const refreshToken = refresh();

    redisClient.set(user.id, refreshToken);
    res
      .status(200)
      .json({ success: true, data: { accessToken, refreshToken } });
  } catch (error) {
    next(error);
  }
};

export const getLogout = async (req, res, next) => {
  try {
    redisClient.del(req.id);
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getActivity = async (req, res, next) => {
  try {
    const { page = 0, type } = req.query;
    if (!type) {
      return next(throwError(400, "query에 type이 없습니다."));
    }

    let data;
    switch (type) {
      case "write":
        data = await Review.find(
          { "writer._id": req.id },
          {
            likes: 0,
            fcltynm: 0,
            prfnm: 0,
            createAt: 0,
            createdAt: 0,
            updatedAt: 0,
            __v: 0,
            casting: 0,
          }
        )
          .sort({ createdAt: -1 })
          .skip(page * 10)
          .limit(10);
        break;
      case "like":
        data = await Like.find({ userId: req.id }, { reviewId: 1 })
          .sort({ _id: -1 })
          .skip(page * 10)
          .limit(10);
        break;

      case "scrap":
        data = await Scrap.find({ userId: req.id }, { showId: 1 })
          .sort({ _id: -1 })
          .skip(page * 10)
          .limit(10);
        break;

      default:
        return next(
          throwError(400, "type key값의 value 값이 올바르지 않습니다.")
        );
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.id, {
      nickname: 1,
      avatarUrl: 1,
      likeReviews: 1,
      scrapShows: 1,
      writeReviews: 1,
    });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const getSeatNum = async (req, res, next) => {
  try {
    const { theaterName } = req.query;
    const seat = await Seat.find({ theaterName });
    console.log(seat.length);

    const theater = await Theater.findOne({ name: theaterName });

    theater.seatNumber = seat.length;
    await theater.save();

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// post seat
export const postSeat = async (req, res, next) => {
  try {
    const { name, location, floor } = req.body;

    await Theater.create({
      name,
      location,
    });

    const result = [];

    req.body.data.forEach((data) => {
      data.forEach(async (data2) => {
        delete data2.color;
        data2.theaterName = name;
        data2.version = 1.0;
        data2.floor = floor;

        const seat = new Seat(data2);
        result.push(seat);
      });
    });

    await Seat.insertMany(result);

    console.log("finished!!");
    console.log(result.length);

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const updateSeat = async (req, res, next) => {
  try {
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getSeat = async (req, res, next) => {
  try {
    const { theaterName } = req.query;

    const seat = await Seat.find({ theaterName }).sort({
      createdAt: 1,
    });

    const obj = {};

    seat.forEach((data) => {
      obj[`${data.floor}층`] = {};
    });

    seat.forEach((data) => {
      const x = obj[`${data.floor}층`];
      x[`${data.section ? data.section : data.column}`] = {};
    });

    seat.forEach((data) => {
      const x = obj[`${data.floor}층`];
      const y = x[`${data.section ? data.section : data.column}`];

      if (
        (data.tags[0] === "휠체어석" && !data.column) ||
        (data.tags[0] === "시야제한석" && !data.column)
      ) {
        console.log("next");
      } else if (!data.section) {
        x[`${data.column}`] = [];
      } else if (!data.column) {
        x[`${data.section}`] = [];
      } else {
        y[`${data.column}`] = [];
      }
    });

    seat.forEach((data) => {
      const x = obj[`${data.floor}층`];
      const y = x[`${data.section ? data.section : data.column}`];

      if (
        (data.tags[0] === "휠체어석" && data.section) ||
        (data.tags[0] === "시야제한석" && !data.column)
      ) {
        console.log("next");
      } else if (data.tags[0] === "휠체어석" && !data.column) {
        delete x[`${data.section ? data.section : data.column}`];
      } else if (!data.section) {
        x[`${data.column}`].push(data.index);
      } else if (!data.column) {
        x[`${data.section}`].push(data.index);
      } else {
        y[`${data.column}`].push(data.index);
      }
    });

    return res.status(200).json({ success: true, data: obj });
  } catch (error) {
    next(error);
  }
};

export const getSeatList = async (req, res, next) => {
  try {
    const { theaterName, floor } = req.query;

    const seat = await Seat.find({ theaterName, floor });

    return res.status(200).json({ success: true, data: seat });
  } catch (error) {
    next(error);
  }
};

export const patchProfile = async (req, res, next) => {
  try {
    const { file } = req;
    const { reset } = req.query;
    const variable = req.body;

    const user = await User.findById(req.id);

    if (!file && reset) {
      s3.deleteObject(
        { Bucket: "bogobogo", Key: `raw/${user.avatarUrl}` },
        (error) => {
          if (error) throw error;
        }
      );
      s3.deleteObject(
        { Bucket: "bogobogo", Key: `w140/${user.avatarUrl}` },
        (error) => {
          if (error) throw error;
        }
      );
      s3.deleteObject(
        { Bucket: "bogobogo", Key: `w600/${user.avatarUrl}` },
        (error) => {
          if (error) throw error;
        }
      );
      variable.avatarUrl = "902e5693-e0bb-4097-8ab5-b81a71003fe4.jpg";
    } else if (file) {
      if (user.avatarUrl !== "902e5693-e0bb-4097-8ab5-b81a71003fe4.jpg") {
        s3.deleteObject(
          { Bucket: "bogobogo", Key: `raw/${user.avatarUrl}` },
          (error) => {
            if (error) throw error;
          }
        );
        s3.deleteObject(
          { Bucket: "bogobogo", Key: `w140/${user.avatarUrl}` },
          (error) => {
            if (error) throw error;
          }
        );
        s3.deleteObject(
          { Bucket: "bogobogo", Key: `w600/${user.avatarUrl}` },
          (error) => {
            if (error) throw error;
          }
        );
      }

      variable.avatarUrl = file.key.split("/")[1];
    }

    const newUser = await User.findByIdAndUpdate(req.id, variable, {
      new: true,
      projection: { avatarUrl: 1, nickname: 1 },
    });

    await Promise.all([
      Review.updateMany(
        { "writer._id": req.id },
        {
          $set: {
            "writer.avatarUrl": newUser.avatarUrl,
            "writer.nickname": newUser.nickname,
          },
        }
      ),
      Theater.updateMany(
        {},
        {
          $set: {
            "review.$[element].writer.nickname": newUser.nickname,
            "review.$[element].writer.avatarUrl": newUser.avatarUrl,
          },
        },
        { arrayFilters: [{ "element.writer._id": req.id }] }
      ),
    ]);

    res.status(200).json({ success: true, data: newUser });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const [user, like] = await Promise.all([
      User.findById(req.id),
      Like.find({ userId: req.id }),
    ]);

    const likeReview = [];
    for (let i = 0, max = like.length; i < max; i++) {
      likeReview.push(like[i].reviewId);
    }

    await Promise.all([
      User.findByIdAndDelete(req.id),
      Review.updateMany(
        { "writer._id": req.id },
        {
          $set: {
            "writer.nickname": "탈퇴 회원",
            "writer.avatarUrl": "902e5693-e0bb-4097-8ab5-b81a71003fe4.jpg",
          },
        }
      ),
      Theater.updateMany(
        {},
        {
          "review.$[element].writer.nickname": "탈퇴 회원",
          "review.$[element].writer.avatarUrl":
            "902e5693-e0bb-4097-8ab5-b81a71003fe4.jpg",
        },
        { arrayFilters: [{ "element.writer._id": req.id }] }
      ),
      Review.updateMany(
        { _id: { $in: likeReview } },
        { $inc: { likeNumber: -1 } }
      ),
      Like.deleteMany({ userId: req.id }),
      Scrap.deleteMany({ userId: req.id }),
    ]);

    if (user.avatarUrl !== "902e5693-e0bb-4097-8ab5-b81a71003fe4.jpg") {
      s3.deleteObject(
        { Bucket: "bogobogo", Key: `raw/${user.avatarUrl}` },
        (error) => {
          if (error) throw error;
        }
      );
      s3.deleteObject(
        { Bucket: "bogobogo", Key: `w140/${user.avatarUrl}` },
        (error) => {
          if (error) throw error;
        }
      );
      s3.deleteObject(
        { Bucket: "bogobogo", Key: `w600/${user.avatarUrl}` },
        (error) => {
          if (error) throw error;
        }
      );
    }

    redisClient.del(req.id);
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
