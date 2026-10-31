/**
 * catalog.js — the fixed lists the app uses.
 *
 * LOCATIONS holds approximate town-centre coordinates [latitude, longitude]
 * for Tamil Nadu towns. A real product would let users drop a GPS pin;
 * a pick-list keeps the demo simple and avoids needing a maps API key.
 */
export const CROPS = [
  "Tomato", "Onion", "Brinjal", "Banana", "Carrot",
  "Cabbage", "Potato", "Groundnut", "Ragi", "Turmeric",
];

export const BUYER_TYPES = ["Hostel / mess", "Restaurant", "Canteen", "Retail store", "Caterer"];

export const LOCATIONS = {
  Chennai: [13.0827, 80.2707],
  Vellore: [12.9165, 79.1325],
  Villupuram: [11.9401, 79.4861],
  Cuddalore: [11.7480, 79.7714],
  Krishnagiri: [12.5186, 78.2137],
  Hosur: [12.7409, 77.8253],
  Dharmapuri: [12.1211, 78.1582],
  Salem: [11.6643, 78.1460],
  Namakkal: [11.2189, 78.1674],
  Erode: [11.3410, 77.7172],
  Tiruppur: [11.1085, 77.3411],
  Coimbatore: [11.0168, 76.9558],
  Pollachi: [10.6609, 77.0048],
  Ooty: [11.4102, 76.6950],
  Karur: [10.9601, 78.0766],
  Perambalur: [11.2342, 78.8807],
  Tiruchirappalli: [10.7905, 78.7047],
  Thanjavur: [10.7870, 79.1378],
  Kumbakonam: [10.9617, 79.3881],
  Dindigul: [10.3673, 77.9803],
  Madurai: [9.9252, 78.1198],
  Theni: [10.0104, 77.4768],
  Tirunelveli: [8.7139, 77.7567],
  Nagercoil: [8.1833, 77.4119],
};

export const coordsOf = (name) => LOCATIONS[name];
