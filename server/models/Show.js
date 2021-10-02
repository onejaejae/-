import mongoose from "mongoose";

const showSchema = new mongoose.Schema(
  {
    // 공연ID
    mt20id: {
      type: String,
      required: true,
    },

    // 공연명
    prfnm: {
      type: String,
      required: true,
    },

    // 공연시작일
    prfpdfrom: {
      type: String,
      required: true,
    },

    // 공연종료일
    prfpdto: {
      type: String,
      required: true,
    },

    // 공연시설명
    fcltynm: {
      type: String,
      required: true,
    },

    // 포스터이미지경로
    poster: {
      type: String,
    },

    // 공연 장르명
    genrenm: {
      type: String,
      required: true,
    },

    // 	공연상태
    prfstate: {
      type: String,
      required: true,
    },

    // 오픈런
    openrun: {
      type: String,
      required: true,
    },

    // 공연관람연령
    prfage: {
      type: String,
      required: true,
    },

    // 공연 런타임
    prfruntime: {
      type: String,
    },

    // 공연출연진
    prfcast: {
      type: Array,
      required: true,
    },

    // 공연제작진
    prfcrew: {
      type: Array,
      required: true,
    },

    // 공연가격표
    pcseguidance: {
      type: Array,
      required: true,
    },

    // 공연시간
    dtguidance: {
      type: Array,
      required: true,
    },

    // 소개이미지목록
    styurls: {
      type: Array,
      required: true,
    },

    // 제작사
    entrpsnm: {
      type: String,
    },

    // 줄거리
    sty: {
      type: String,
    },
  },

  { timestamps: true }
);

const Show = mongoose.model("Show", showSchema);

export default Show;
