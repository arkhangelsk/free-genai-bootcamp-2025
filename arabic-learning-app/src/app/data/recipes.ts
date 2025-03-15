// data/recipes.ts
import { Recipe } from "../types/recipe";

export const recipes: Recipe[] = [
  {
    title: "Hummus",
    arabicTitle: "حمص",
    transliteration: "ḥummuṣ",
    description:
      "A creamy dip made from blended chickpeas, tahini, lemon juice, and garlic.",
    question: {
      arabic: "هل تحب الحمص؟",
      transliteration: "hal tuḥibb al-ḥummuṣ?",
      english: "Do you like hummus?",
    },
    ingredients: [
      {
        name: "Chickpeas",
        arabicName: "حمص",
        transliteration: "ḥummuṣ",
        image: "/chickpeas.jpg",
        description:
          "The main ingredient in hummus, these legumes are rich in protein and fiber.",
      },
      {
        name: "Tahini",
        arabicName: "طحينة",
        transliteration: "ṭaḥīna",
        image: "/tahini.jpg",
        description:
          "A paste made from ground sesame seeds, adding richness and nutty flavor.",
      },
      {
        name: "Lemon",
        arabicName: "ليمون",
        transliteration: "laymūn",
        image: "/lemon.jpg",
        description: "Adds brightness and balances the flavors.",
      },
      {
        name: "Garlic",
        arabicName: "ثوم",
        transliteration: "thūm",
        image: "/garlic.jpg",
        description: "Provides a pungent kick and depth of flavor.",
      },
    ],
  },
  {
    title: "Falafel",
    arabicTitle: "فلافل",
    transliteration: "falāfil",
    description:
      "Deep-fried patties made from ground chickpeas, herbs, and spices.",
    question: {
      arabic: "كيف تحب الفلافل؟",
      transliteration: "kayf tuḥib al-falāfil?",
      english: "How do you like your falafel?",
    },
    ingredients: [
      {
        name: "Chickpeas",
        arabicName: "حمص",
        transliteration: "ḥummuṣ",
        image: "/chickpeas.jpg",
        description: "Soaked and ground to form the base of falafel.",
      },
      {
        name: "Parsley",
        arabicName: "بقدونس",
        transliteration: "baqdounis",
        image: "/parsley.jpg",
        description: "Fresh herb that adds color and fresh flavor.",
      },
      {
        name: "Coriander",
        arabicName: "كزبرة",
        transliteration: "kuzbara",
        image: "/coriander.jpg",
        description: "Both leaves and seeds are used for authentic flavor.",
      },
      {
        name: "Cumin",
        arabicName: "كمون",
        transliteration: "kammūn",
        image: "/cumin.jpg",
        description: "Adds warmth and earthiness to the spice blend.",
      },
    ],
  },
  {
    title: "Shawarma",
    arabicTitle: "شاورما",
    transliteration: "shāwarmā",
    description:
      "Marinated meat cooked on a rotating spit, served with bread and vegetables.",
    question: {
      arabic: "ما نوع الشاورما المفضل لديك؟",
      transliteration: "mā naw' al-shāwarmā al-mufaḍḍal ladayk?",
      english: "What's your favorite type of shawarma?",
    },
    ingredients: [
      {
        name: "Chicken/Meat",
        arabicName: "دجاج/لحم",
        transliteration: "dajāj/laḥm",
        image: "/meat.jpg",
        description:
          "Marinated in Middle Eastern spices and slow-cooked on a vertical rotisserie.",
      },
      {
        name: "Garlic Sauce",
        arabicName: "ثومية",
        transliteration: "thūmiyya",
        image: "/garlic-sauce.jpg",
        description:
          "A creamy emulsion of garlic, oil, and lemon juice, also known as toum.",
      },
      {
        name: "Pita Bread",
        arabicName: "خبز",
        transliteration: "khubz",
        image: "/pita.jpg",
      },
      {
        name: "Pickles",
        arabicName: "مخلل",
        transliteration: "mukhallal",
        image: "/pickles.jpg",
        description: "Adds crunch and tangy flavor to balance the rich meat.",
      },
    ],
  },
];
