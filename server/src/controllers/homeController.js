import axios from "axios";
import convert from "xml-js";
import mongoose from "mongoose";
import Show from "../models/Show";
import Theater from "../models/Theater";
import User from "../models/User";
import throwError from "../utils/throwError";
import Review from "../models/Review";
import Scrap from "../models/Scrap";

const RemoveJsonTextAttribute = (value, parentElement) => {
  try {
    const keyNo = Object.keys(parentElement._parent).length;
    const keyName = Object.keys(parentElement._parent)[keyNo - 1];
    parentElement._parent[keyName] = value;
  } catch (e) {
    console.error(e);
  }
};

// 공연 정보 db에 저장하는 로직

export const postShow = async (req, res, next) => {
  try {
    const { page, code, shprfnmfct } = req.query;

    const baseUrl = `http://www.kopis.or.kr/openApi/restful/pblprfr?service=${process.env.OPENAPI_SECRET_KEY}&stdate=20180101&eddate=20220228&rows=300`;

    const config = {
      cpage: page,
      shcate: code,
      shprfnmfct,
    };

    const params = new URLSearchParams(config).toString();
    const finalUrl = `${baseUrl}&${params}`;

    const { data } = await axios.get(finalUrl);
    const jsonData = convert.xml2json(data, {
      compact: true,
      spaces: 4,
      textFn: RemoveJsonTextAttribute,
    });

    const obj = JSON.parse(jsonData);
    const showObj = obj.dbs.db;
    console.log("length", showObj.length);

    const theater = [
      "블루스퀘어 (신한카드홀(구. 인터파크홀))",
      "충무아트센터 (대공연장)",
      "샤롯데씨어터 (샤롯데씨어터)",
      "디큐브아트센터 (디큐브씨어터)",
      "두산아트센터 (연강홀)",
      "홍익대 대학로 아트센터 (대극장)",
      "LG아트센터 (LG아트센터)",
      "예술의전당 (CJ 토월극장)",
      "예술의전당 (오페라극장)",
      "한성아트홀(구. 인켈아트홀) (1관)",
      "한성아트홀(구. 인켈아트홀) (2관)",
      "한국소리문화의전당 (연지홀)",
      "한국소리문화의전당 (모악당)",
      "플러스씨어터(구. 컬처스페이스 엔유 구. 쁘티첼 씨어터) (플러스씨어터) ",
      "큐씨어터(구. 수상한흥신소전용관) (큐씨어터(구. 수상한흥신소전용관))",
      "컬쳐씨어터(구. 휴먼시어터) (컬쳐씨어터(구. 휴먼시어터))",
      "콘텐츠박스(구. 르메이에르 씨어터) (콘텐츠박스(구. 르메이에르 씨어터)) ",
      "천안예술의전당 (대공연장)",
      "인천문화예술회관 (대공연장)",
      "이화여자대학교 삼성홀 (이화여자대학교 삼성홀)",
      "유니플렉스 (1관(대극장))",
      "유니플렉스 (2관(중극장))",
      "유니플렉스 (3관(소극장))",
      "울산문화예술회관 (대공연장) ",
      "예술의전당 (자유소극장)",
      "예술공간 혜화 (예술공간 혜화) ",
      "예그린씨어터 (예그린씨어터)",
      "업스테이지(UP Stage) (업스테이지(UP Stage))",
      "아티스탄홀 (아티스탄홀)",
      "아르코예술극장 (소극장)",
      "아르코예술극장 (대극장)",
      "아루또소극장(구. 소담소극장, 구. 코메디컬센터) (아루또소극장(구. 소담소극장, 구. 코메디컬센터))",
      "성남아트센터 (오페라하우스)",
      "성남아트센터 (앙상블씨어터)",
      "서경대학교 공연예술센터 (스콘1관) ",
      "서경대학교 공연예술센터 (스콘2관)",
      "세종문화회관 (대극장)",
      "JS아트홀 (구. 고스트씨어터 구.다소니씨어터) (JS아트홀 (구. 고스트씨어터 구.다소니씨어터))",
      "JTN 아트홀(구. 대학로예술마당) (1관)",
      "JTN 아트홀(구. 대학로예술마당) (2관)",
      "JTN 아트홀(구. 대학로예술마당) (3관)",
      "JTN 아트홀(구. 대학로예술마당) (4관)",
      "KT&G 상상마당 대치아트홀 (KT&G 상상마당 대치아트홀)",
      "경기아트센터(구. 경기도문화의전당) (대극장)  ",
      "광림아트센터 (BBCH홀)",
      "국립극장 (해오름극장)",
      "국립정동극장 (국립정동극장)",
      "광주문화예술회관 (대극장)",
      "나온씨어터 (나온씨어터)",
      "달밤엔씨어터 (달밤엔씨어터)",
      "대전예술의전당 (아트홀) ",
      "대학로예술극장 (소극장) ",
      "대학로예술극장 (대극장)",
      "예울마루 (대극장)",
      "예스24 스테이지(구. DCF대명문화공장) (1관 )",
      "예스24 스테이지(구. DCF대명문화공장) (2관 )",
      "예스24 스테이지(구. DCF대명문화공장) (3관(구. 수현재씨어터))",
      "올래홀 (올래홀)",
      "아트포레스트 아트홀 (1관)",
      "대학로자유극장 (대학로자유극장)",
      "틴틴홀 (틴틴홀)",
      "댕로홀 (댕로홀)",
      "동국대학교 (이해랑예술극장)",
      "대학로 두레홀 3관 (대학로 두레홀 3관)",
      "대학로 드림아트센터 (1관)",
      "대학로 드림아트센터 (2관 더블케이씨어터)",
      "대학로 드림아트센터 (3관 나몰라홀)",
      "대학로 드림아트센터 (4관)",
      "라온아트홀 (라온아트홀)",
      "마루아트홀 (마루아트홀)",
      "국립극단 [명동] (명동예술극장)",
      "백암아트홀 (백암아트홀)",
      "별빛소극장 (별빛소극장)",
      "봄날아트홀(구. 아리랑소극장) (1관(지하1층)",
      "봄날아트홀(구. 아리랑소극장) (2관(지하2층))",
      "드림씨어터 [부산] (드림씨어터)",
      "부산시민회관 (소극장)",
      "부산시민회관 (대극장)",
      "브릭스씨어터 (구. 콘텐츠 그라운드 구. 브로드웨이아트홀 [3관]) (브릭스씨어터 (구. 콘텐츠 그라운드 구. 브로드웨이아트홀 [3관]))",
      "호은아트홀(구 키득키득아트홀) (호은아트홀(구 키득키득아트홀))",
      "해피씨어터 (해피씨어터)",
      "티오엠씨어터(구. 문화공간필링) (1관)",
      "티오엠씨어터(구. 문화공간필링) (2관)",
    ];

    showObj.map(async (data2) => {
      try {
        const showId = data2.mt20id;
        const showData = await axios.get(
          `http://www.kopis.or.kr/openApi/restful/pblprfr/${showId}?service=${process.env.OPENAPI_SECRET_KEY}`
        );

        const showjsonData = convert.xml2json(showData.data, {
          compact: true,
          spaces: 4,
          textFn: RemoveJsonTextAttribute,
        });

        const obj2 = JSON.parse(showjsonData);
        const showObj2 = obj2.dbs.db;

        if (theater.includes(showObj2.fcltynm)) {
          let cast = [];
          let crew = [];
          let seguidance = [];
          let dtguidance = [];
          const styurls = [];

          if (typeof showObj2.prfcast !== "object") {
            cast = showObj2.prfcast.split(",");
            cast[cast.length - 1] = cast[cast.length - 1].replace(" 등", "");
          }

          if (typeof showObj2.prfcrew !== "object") {
            crew = showObj2.prfcrew.split(",");
            crew[crew.length - 1] = crew[crew.length - 1].replace(" 등", "");
          }

          if (typeof showObj2.pcseguidance !== "object") {
            seguidance = showObj2.pcseguidance.split("원");
            seguidance.forEach((guidance, index) => {
              seguidance[index] = guidance.replace(", ", "");
              seguidance.splice(seguidance.length - 1);
            });
          }

          if (typeof showObj2.dtguidance !== "object") {
            dtguidance = showObj2.dtguidance.split(")");
            dtguidance.splice(dtguidance.length - 1);
            dtguidance.forEach((guidance, index) => {
              dtguidance[index] = guidance.replace(", ", "");
              dtguidance[index] += ")";
            });
          }

          if (showObj2.styurls !== {}) {
            for (const property in showObj2.styurls) {
              styurls.push(showObj2.styurls[property]);
            }
          }

          const variable = {
            mt20id: showObj2.mt20id,
            prfnm: showObj2.prfnm,
            prfpdfrom: showObj2.prfpdfrom,
            prfpdto: showObj2.prfpdto,
            fcltynm: showObj2.fcltynm,
            poster: typeof showObj2.poster === "object" ? "" : showObj2.poster,
            genrenm: showObj2.genrenm,
            prfstate: showObj2.prfstate,
            openrun: showObj2.openrun,
            prfage: showObj2.prfage,
            prfruntime:
              typeof showObj2.prfruntime === "object"
                ? ""
                : showObj2.prfruntime,
            prfcast: cast,
            prfcrew: crew,
            pcseguidance: seguidance,
            entrpsnm:
              typeof showObj2.entrpsnm === "object" ? "" : showObj2.entrpsnm,
            sty: typeof showObj2.sty === "object" ? "" : showObj2.sty,
            dtguidance,
            styurls,
          };

          const show = new Show(variable);
          await show.save();
        }
      } catch (error) {
        console.error(error);
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getShow = async (req, res, next) => {
  try {
    const { genrenm, page = 0, sort, type } = req.query;

    if (!genrenm) {
      return next(throwError(400, "query에 genrenm이 없습니다."));
    }
    let shows;
    let sortVariable = { prfnm: 1 };

    switch (sort) {
      case "name":
        sortVariable = { prfnm: 1 };
        break;
      case "latest":
        sortVariable = { prfpdfrom: -1 };
        break;
      case "rating":
        sortVariable = { rating: -1, prfnm: 1 };
        break;

      default:
        return next(throwError(400, "sort가 잘못되었습니다."));
    }

    if (genrenm === "연극" && type) {
      const findVariable =
        type === "open"
          ? { genrenm, openrun: "Y", prfstate: "공연중" }
          : { genrenm, openrun: "N", prfstate: "공연중" };

      shows = await Show.find(findVariable, {
        scraps: 0,
        __v: 0,
        updatedAt: 0,
        createdAt: 0,
        totalRating: 0,
      })
        .sort(sortVariable)
        .skip(page * 10)
        .limit(10);

      return res.status(200).json({ success: true, data: shows });
    } else {
      shows = await Show.find(
        { genrenm, prfstate: "공연중" },
        { __v: 0, updatedAt: 0, createdAt: 0, totalRating: 0 }
      )
        .sort(sortVariable)
        .skip(page * 10)
        .limit(10);
    }

    res.status(200).json({ success: true, data: shows });
  } catch (error) {
    next(error);
  }
};

export const getShowDetail = async (req, res, next) => {
  try {
    const { showId } = req.params;
    const { page = 0 } = req.query;

    if (!mongoose.isValidObjectId(showId))
      return next(throwError(400, "showId가 유효하지 않습니다."));

    const show = await Show.findById(showId, {
      scraps: 0,
      totalRating: 0,
      createdAt: 0,
      updatedAt: 0,
      __v: 0,
    });
    const review = await Review.find(
      { showId },
      { createAt: 0, __v: 0, updatedAt: 0, createdAt: 0 }
    )
      .skip(page * 10)
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({ success: true, data: { show, review } });
  } catch (error) {
    next(error);
  }
};

export const getSearchShow = async (req, res, next) => {
  try {
    const { term, page = 0, sort } = req.query;
    let variable = { prfnm: 1 };
    if (sort) {
      switch (sort) {
        case "name":
          variable = { prfnm: 1 };
          break;
        case "latest":
          variable = { prfpdfrom: -1 };
          break;
        case "rating":
          variable = { rating: -1, prfpdfrom: -1 };
          break;
        default:
          return next(
            throwError(400, "sort key값의 value 값이 올바르지 않습니다.")
          );
      }
    }
    const show = await Show.find(
      {
        genrenm: "연극",
        prfnm: { $regex: term, $options: "i" },
      },
      { __v: 0, updatedAt: 0, createdAt: 0, totalRating: 0 }
    )
      .sort(variable)
      .skip(page * 10)
      .limit(10);
    res.status(200).json({ success: true, data: show });
  } catch (error) {
    next(error);
  }
};

export const getSearchMusical = async (req, res, next) => {
  try {
    const { term, page = 0, sort } = req.query;

    let variable = { prfnm: 1 };
    if (sort) {
      switch (sort) {
        case "name":
          variable = { prfnm: 1 };
          break;
        case "latest":
          variable = { prfpdfrom: -1 };
          break;
        case "rating":
          variable = { rating: -1, prfpdfrom: -1 };
          break;

        default:
          return next(
            throwError(400, "sort key값의 value 값이 올바르지 않습니다.")
          );
      }
    }

    const musical = await Show.find(
      {
        genrenm: "뮤지컬",
        prfnm: { $regex: term, $options: "i" },
      },
      { __v: 0, updatedAt: 0, createdAt: 0, totalRating: 0 }
    )
      .sort(variable)
      .skip(page * 10)
      .limit(10);

    res.status(200).json({ success: true, data: musical });
  } catch (error) {
    next(error);
  }
};

export const getSearchTheater = async (req, res, next) => {
  try {
    const { term, page = 0 } = req.query;
    const theater = await Theater.find(
      {
        name: { $regex: term, $options: "i" },
      },
      {
        "review.__v": 0,
        "review.createdAt": 0,
        "review.createAt": 0,
        "review.updatedAt": 0,
      }
    )
      .sort({ name: 1 })
      .skip(page * 10)
      .limit(10);

    res.status(200).json({ success: true, data: theater });
  } catch (error) {
    next(error);
  }
};

export const getReviewList = async (req, res, next) => {
  try {
    const { sort } = req.query;

    if (sort !== "latest" && sort !== "like") {
      return next(throwError(400, "sort가 잘못되었습니다."));
    }

    const sortVariable =
      sort === "latest" ? { _id: -1 } : { likeNumber: -1, _id: -1 };

    const review = await Review.find({}).sort(sortVariable).limit(10);
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

export const postScrap = async (req, res, next) => {
  try {
    const { showId } = req.params;
    if (!mongoose.isValidObjectId(showId)) {
      return next(throwError(400, "showId가 유효하지 않습니다."));
    }

    await Promise.all([
      Scrap.create({ userId: req.id, showId }),
      User.findByIdAndUpdate(req.id, {
        $addToSet: { scrapShows: showId },
      }),
    ]);

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const deleteUnScrap = async (req, res, next) => {
  try {
    const { showId } = req.params;
    if (!mongoose.isValidObjectId(showId)) {
      return next(throwError(400, "showId가 유효하지 않습니다."));
    }

    await Promise.all([
      Scrap.findOneAndDelete({ showId }),
      User.findByIdAndUpdate(req.id, {
        $pull: { scrapShows: showId },
      }),
    ]);

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
