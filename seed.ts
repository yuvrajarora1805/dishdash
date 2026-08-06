import { SoloAPI } from './lib/api';

async function seed() {
  console.log('Seeding dummy products...');
  const products = [
    { name: "Noise Cancelling Headphones Pro", price: 24900, tag: "Tech", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80" },
    { name: "Minimalist Ceramic Coffee Mug", price: 2450, tag: "Home", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&auto=format&fit=crop&q=80" },
    { name: "Smart Home Assistant Hub", price: 12900, tag: "Tech", image: "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=800&auto=format&fit=crop&q=80" },
    { name: "Premium Leather Wallet", price: 6500, tag: "Lifestyle", image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80" },
    { name: "Mechanical Keyboard RGB", price: 14900, tag: "Tech", image: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&auto=format&fit=crop&q=80" },
    { name: "Stainless Steel Water Bottle", price: 3500, tag: "Lifestyle", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80" }
  ];

  for (const p of products) {
    await SoloAPI.createProduct({
      name: p.name,
      price: p.price,
      images: JSON.stringify([p.image]),
      data: JSON.stringify({ is_trending: true, tag: p.tag })
    });
  }
  
  console.log('Done seeding!');
  process.exit(0);
}

seed();
