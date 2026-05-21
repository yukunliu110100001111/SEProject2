export const CUSTOMIZE_LOADING_SRC =
  'https://assets-v2.lottiefiles.com/a/fa49d2c6-1171-11ee-8950-d337473ad8ad/vqdYXT26Kk.lottie';

export const LOGIN_LOADING_SRC =
  'https://lottie.host/b4c270dd-9fe9-42f1-8fda-2b2e99a81aee/CkKaQzp5gw.lottie';

export const PAGE_LOADING_SRCS = [
  'https://lottie.host/0898273a-d9df-4357-901d-afb445312740/u3VKU0Ur9t.lottie',
  'https://lottie.host/8359f6bc-3533-4d11-b55a-65133a8468c6/r1mzvN39x7.lottie',
];

export const pickPageLoadingSrc = () =>
  PAGE_LOADING_SRCS[Math.floor(Math.random() * PAGE_LOADING_SRCS.length)];
