### 보고보고 소개

---

<br>

<img src="https://user-images.githubusercontent.com/62149784/144738485-aba7957a-bcb4-449c-ba1d-77e71fe9b0f7.jpg">

<br>

😊 공연 정보 제공 앱 서비스

- 공연 리뷰 탐색 및 검색
- 상세한 공연 후기 확인 (좌석별/배우별/일자별)
- 나만의 공연 리뷰 작성

<br>

### 1. DATABASE

---

<br>

- DB는 `MongoDB` 사용

- Node.js와 MongoDB를 위한 ODM 라이브러리인 `Mongoose` 사용

<br>

### 1.1 데이터 모델링

---

<BR>

<img src="https://user-images.githubusercontent.com/62149784/144739152-dab0d842-549f-466a-b61f-5e4a0a507222.jpg">

<br>

### 1.2 Mongodb Nested 설계

---

<br>

🤷‍♀️ Nested로 설계한 이유

<br>

✔ read 할 때 들어가는 가공을 create, update, delete 할 때 가공함으로써 읽기 성능 개선을 하였습니다.

✔ 어플 특성 상 읽기 빈도가 쓰기 빈도보다 훨씬 높다고 판단하였기 때문에 읽기 작업에서 혜택을 보자는 방향으로 설계하였습니다.

<br>

📌 nested modeling 예시

<br>

<img src="https://user-images.githubusercontent.com/62149784/144739531-b9539904-3a00-4472-83b6-68855223a8c3.jpg">

<br>

📌 서비스 내 구현 예시

<img src="https://user-images.githubusercontent.com/62149784/144739584-d6ede1ac-c709-45b7-b2d5-93b4f6691571.jpg">

<br>

- 극장을 선택하면 해당 극장에 대한 시야 리뷰가 나오는데 이를 `nested` 방식으로 설계하여 `db 호출을 최소화`하여 `response time`을 줄이기 위해 코드를 구현하였습니다.

<br>

### 1.3 복잡한 로직 구현

---

<br>

📝 적용 사례

<br>

<img src="https://user-images.githubusercontent.com/62149784/144739733-e3d77277-11b7-4ff3-82da-729794bd71bd.jpg">

- 리뷰를 삭제 할 시 내장된 리뷰들을 처리하는 로직입니다.

<br>

### 2. Authentication

---

<br>

<img src="https://user-images.githubusercontent.com/62149784/144740551-4800167f-65c9-44f5-a622-2580b4e81640.png">

<br>

- jwt를 사용하여 apple, kakao, google 로그인 연동 기능을 구현하였습니다.

<br>

### 3. Restful API

---

📌 REST에서 가장 중요하며 기본적인 규칙 두가지를 준수하기 위해 노력했습니다.

1.  URI는 정보의 자원을 표현해야 한다. (`리소스 식별`)

2.  자원에 대한 행위는 HTTP Method로 표현한다.

<br>

📌 API 명세서 (https://documenter.getpostman.com/view/13091019/U16kr58K)

<br>

### 4. respons time 최적화

---

<br>

📌 운영환경에서 `response Time`을 최대 `200ms`로 유지하기 위해 노력하였습니다.

<br>

### 4.1 Promise.all

---

<br>

<img src="https://user-images.githubusercontent.com/62149784/115832217-9ab62f00-a44d-11eb-8f5c-8c69479bca4c.png">

<br>

`참고자료`(https://code-masterjung.tistory.com/91)

<br>

📝 적용 사례

<br>

<img src="https://user-images.githubusercontent.com/62149784/144740847-7c66119c-7946-42eb-b1fc-4fd3b82456c8.jpg">

<br>

✔ 순서가 보장되지 않아도 되는 상황에서 `Promise.all`을 사용해 여러개의 비동기 처리를 `병렬적`으로 처리해 조금이라도 `Response Time`을 개선하기 위한 코드를 구현하였습니다.

<br>

### 4.2 Pagenation

---

<br>

📌 `pagenation`을 구현해 클라이언트에서 필요한 데이터만 불러오게 하여 서비스 최적화를 고려했습니다.

<br>

📝 적용 사례

<br>

<img src="https://user-images.githubusercontent.com/62149784/144741042-a327b443-fc78-48a4-8903-d97017c81eb3.jpg">

<br>

### 5. NodeJs 성능 향상

---

<br>

✔ Node.js는 기본적으로 싱글 스레드(thread)이므로  Node.js 애플리케이션은 단일 CPU 코어에서 실행되어 CPU의 멀티코어 시스템은 사용할 수 없습니다. 

✔  PM2의 cluster 모드는 Node.js의 cluster module을 이용해 기본적으로 싱글 스레드인 Node.js를 멀티 스레드로 구동시켜줍니다.

<br>

📝 적용 사례

<br>

<img src="https://user-images.githubusercontent.com/62149784/144743313-eeb1de3d-de3f-400f-92c5-c17e5b0c1a33.jpg
">


<br>

 pm2를 통해 Node.js가 싱글 스레드라서 주어진 자원을 최대한 활용하지 못하고 하나의 CPU만 사용하는 문제를 해결할 수 있습니다.



<br>

참고 자료 (https://engineering.linecorp.com/ko/blog/pm2-nodejs/)

<br>

### 6. 이미지 최적화

---

<br>

<img src="https://user-images.githubusercontent.com/62149784/144743935-ac731424-5ed5-4438-994e-b3c17a093281.png
">

<br>

🤷‍♂️ Lambda를 이용한 이미지 리사이징 이유

- 브라우저에 이미지 파일을 보여주는 것은 네트워크 통신을 하는 것이기 때문에 큰 용량의 이미지보다(원본 이미지) 작은 용량의 이미지(리사이징된 이미지)를 가져오는 것이 네트워크 비용을 생각했을 때 더 효율적이기 때문입니다. 실제로 리사이징된 이미지는 원본 이미지보다 용량이 몇배는 차이가 났습니다.

<br>

🤷‍♂️ CloudFront를 사용한 이유

-  CloudFront를 통해 서비스하는 콘텐츠를 사용자가 요청하면 지연 시간이 가장 낮은 엣지 로케이션으로 요청이 라우팅되므로 가능한 최고의 성능으로 콘텐츠가 제공됩니다.

<br>

참고자료 (https://www.inflearn.com/course/%EC%9D%B4%EB%AF%B8%EC%A7%80-%EA%B4%80%EB%A6%AC-%ED%92%80%EC%8A%A4%ED%83%9D#)

<br>

### 6. 배포

---

<br>

<img src="https://user-images.githubusercontent.com/62149784/144744195-0800e23f-1056-4a56-86ed-8efe7f4c91fc.png
">

<br>



### 7. 개선할 점

---

<br>

1. 최근 Nest를 공부하면서 알게 된 점으로 controller에 너무 많은 비즈니스 로직을 두는 것보다 service단을 따로 두어 비즈니스 로직을 처리하는 것이 견고한 설계라는 것을 알게 되었습니다. 

2. 공연 정보 데이터를 업데이트하는 과정 대한 코드 리펙토링이 진행되어야 합니다. 
  
<br>
