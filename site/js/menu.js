/* ============================================================
   TOASTIES MENU
   Edit prices, names and descriptions here — the page rebuilds
   itself from this list. Prices are shown as-is (no math done),
   so "8.50" and "9" both work.
   `photo` is optional; it points at a file in assets/gallery/.
   `focus` (optional) is the CSS object-position for the round thumbnail,
   e.g. "50% 70%" to centre the crop lower in the photo.
   ============================================================ */

window.TOASTIES_MENU = {
  notes: {
    tax: "Tax is extra",
    chalkboard: "See the chalkboard for the daily soup & Toastie of the Day",
  },

  sections: [
    {
      id: "toasties",
      title: "Toasties",
      subtitle: "Served on classic white bread, grilled in our garlic parmesan butter.",
      upgrade: { label: "Upgrade any Toastie to sourdough", price: "3" },
      items: [
        { name: "The Classic",       price: "7",    desc: "Two slices of cheese, shredded mozza & cheddar.", photo: "classic.jpg", focus: "50% 45%", tag: "Start here" },
        { name: "The Dilly",         price: "8",    desc: "The Classic with pickles and potato chips.", photo: "dilly.jpg", focus: "45% 75%", tag: "Fan favourite" },
        { name: "The Tomater",       price: "8.50", desc: "The Classic with sliced tomato and fresh basil.", photo: "tomater.jpg", focus: "50% 55%" },
        { name: "The Sweet & Spicy", price: "9",    desc: "The Classic with jalapeño peppers and honey.", photo: "sweet-and-spicy.jpg", focus: "40% 45%", tag: "Has a kick" },
        { name: "The Golden Onion",  price: "9",    desc: "The Classic with grainy mustard and caramelized onion." },
        { name: "The Eggy",          price: "12",   desc: "The Classic with fried egg and bacon." },
      ],
    },
    {
      id: "sweet-melts",
      title: "Sweet Melts",
      subtitle: "Served on sourdough bread, grilled in honey butter.",
      items: [
        { name: "The Funky Monkey",  price: "11", desc: "Banana, Nutella, and crunchy peanut butter.", photo: "sweet-melt.jpg", focus: "50% 70%" },
        { name: "The Crunchy Nut",   price: "12", desc: "Crushed pretzels, Nutella, and crunchy peanut butter." },
        { name: "The S'mores",       price: "12", desc: "Nutella, marshmallows, and graham crackers.", photo: "smores.jpg", focus: "45% 60%", tag: "Campfire vibes" },
        { name: "The Grilled Elvis", price: "14", desc: "Bacon, banana, and crunchy peanut butter.", tag: "The King" },
      ],
    },
  ],

  addOns: {
    title: "The Add-Ons",
    subtitle: "Add to any Toastie — or build your own.",
    groups: [
      { price: "1", items: ["Sliced tomato", "Potato chips", "Pickles", "Grainy mustard", "Honey"] },
      { price: "2", items: ["Caramelized onion", "Jalapeños", "Double cheese"] },
      { price: "3", items: ["Fried egg", "Bacon (2 strips)"] },
    ],
  },

  sides: {
    title: "The Sides",
    items: [
      { name: "Popcorn", price: "2" },
      { name: "Carrot sticks", price: "2" },
      { name: "Potato chips", price: "2" },
      { name: "Pickles", price: "2" },
    ],
  },

  drinks: {
    title: "The Drinks",
    items: [
      { name: "Canned pop", price: "2" },
      { name: "Sparkling water", price: "2" },
      { name: "Bottled water", price: "3" },
    ],
  },
};
