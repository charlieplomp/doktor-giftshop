// Productcatalogus — Dr. Gift Shop
const PRODUCTS = [
  {
    id: "tshirt",
    name: "T-shirt",
    price: 21.50,
    categories: ["Sport"],
    bestseller: true,
    image: "images/tshirt.jpg",
    description: "Zacht katoenen T-shirt met een knipoog naar het doktersleven. Comfortabel voor onder de witte jas of gewoon in het weekend."
  },
  {
    id: "romper",
    name: "Romper",
    price: 19.95,
    categories: ["Kind"],
    bestseller: false,
    image: "images/romper.jpg",
    description: "Zwarte romper, 100% katoen, met befje-opdruk. Alleen verkrijgbaar in maat 62/68 (ca. 2 – 6 maanden)."
  },
  {
    id: "beer-stethoscoop",
    name: "Beer met stethoscoop",
    price: 45.00,
    categories: ["Kind"],
    bestseller: true,
    image: "images/beer-stethoscoop.jpg",
    description: "Lieve zachte beer met toga (100% badstof katoen). Lengte 30 cm. Inclusief kaart."
  },
  {
    id: "slabbetje",
    name: "Slabbetje",
    price: 37.50,
    categories: ["Kind"],
    bestseller: false,
    image: "images/slabbetje.jpg",
    description: "Slab met mouwen, 100% badstof katoen (wit katoen). Voor peuter vanaf ca. 2 jaar. Per 2 stuks."
  },
  {
    id: "cappuccino-kopje",
    name: "Cappuccino kopje & schotel",
    price: 18.50,
    categories: ["Keuken", "Office"],
    bestseller: true,
    image: "images/mok.jpg",
    minQty: 2,
    description: "Grote porseleinen kop en schotel, vaatwasser en magnetron bestendig. Minimale bestelling: 2 stuks."
  },
  {
    id: "espresso-kopje",
    name: "Espresso kopje & schotel",
    price: 15.95,
    categories: ["Keuken", "Office"],
    bestseller: true,
    image: "images/espressokopje.jpg",
    minQty: 2,
    description: "Kleine porseleinen kop en schotel, vaatwasser en magnetron bestendig. Minimale bestelling: 2 stuks."
  },
  {
    id: "ansichtkaarten",
    name: "Ansichtkaarten",
    price: 8.50,
    categories: ["Office"],
    bestseller: false,
    image: "images/ansichtkaarten.jpg",
    description: "Set ansichtkaarten met het Dr. Gift Shop-logo, in het donkerblauw en rood. Leuk om te versturen of op te hangen op de afdeling."
  },
  {
    id: "bordje",
    name: "Ontbijt-/lunchbordje",
    price: 14.00,
    categories: ["Keuken"],
    bestseller: false,
    image: "images/bordje.jpg",
    minQty: 2,
    description: "Porseleinen bordje, geschikt voor ontbijt, lunch of een taartje (dia 21 cm), vaatwasser en magnetron bestendig. Minimale bestelling: 2 stuks."
  },
  {
    id: "bierviltjes",
    name: "Bierviltjes",
    price: 20.00,
    categories: ["Keuken"],
    bestseller: false,
    image: "images/coasters.jpg",
    description: "Leuke kartonnen bierviltjes (dia 10 cm), 50 stuks."
  }
];
