export default function Footer() {
  return (
    <footer className="bg-kwetu-green-dark text-kwetu-cream mt-20">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-kwetu-gold font-bold text-lg mb-2">Kwetu Hotel</h3>
          <p className="text-sm opacity-80">Your Home Away From Home</p>
        </div>
        <div>
          <h4 className="text-kwetu-gold font-semibold mb-2">Location</h4>
          <p className="text-sm opacity-80">Homabay County, Kenya</p>
          <p className="text-sm opacity-80">Near Ruma National Park</p>
        </div>
        <div>
          <h4 className="text-kwetu-gold font-semibold mb-2">Contact</h4>
          <p className="text-sm opacity-80">info@kwetuhotel.co.ke</p>
          <p className="text-sm opacity-80">+254 700 000 000</p>
        </div>
      </div>
      <div className="text-center text-xs opacity-60 pb-6">
        © {new Date().getFullYear()} Kwetu Hotel. All rights reserved.
      </div>
    </footer>
  );
}
