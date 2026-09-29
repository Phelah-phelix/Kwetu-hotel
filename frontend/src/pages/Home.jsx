import { Link } from 'react-router-dom';

const amenities = [
  { name: 'Accommodation', desc: 'Standard, Deluxe & Suite rooms for every need.' },
  { name: 'Spa & Gym', desc: 'Full-service spa treatments and a modern gym.' },
  { name: 'Swimming Pool', desc: 'Relax poolside any time of day.' },
  { name: 'Conference & Meetings', desc: 'Fully-equipped halls for events of any size.' },
  { name: 'Ruma National Park Tours', desc: 'Guided day tours just minutes away.' },
  { name: 'Fine Dining', desc: 'Coming soon — our restaurant experience.' },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-kwetu-green text-kwetu-cream">
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Welcome to <span className="text-kwetu-gold">Kwetu Hotel</span>
          </h1>
          <p className="text-xl italic mb-8">Your Home Away From Home</p>
          <p className="max-w-2xl mx-auto mb-10 opacity-90">
            A five-star escape in Homabay County, Kenya — steps away from
            Ruma National Park, with everything you need for rest, work, and adventure.
          </p>
          <Link
            to="/rooms"
            className="bg-kwetu-gold text-kwetu-green-dark font-semibold px-8 py-3 rounded-md hover:bg-kwetu-gold-light transition-colors inline-block"
          >
            Explore Rooms
          </Link>
        </div>
      </section>

      {/* Amenities */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-kwetu-green text-center mb-12">
          Everything You Need, All in One Place
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {amenities.map((a) => (
            <div
              key={a.name}
              className="border border-kwetu-gold/30 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-kwetu-green font-semibold text-lg mb-2">{a.name}</h3>
              <p className="text-gray-600 text-sm">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-kwetu-cream border-y border-kwetu-gold/20 py-16 text-center">
        <h2 className="text-2xl font-bold text-kwetu-green mb-4">
          Ready to feel at home?
        </h2>
        <Link
          to="/register"
          className="bg-kwetu-green text-kwetu-cream font-semibold px-8 py-3 rounded-md hover:bg-kwetu-green-dark transition-colors inline-block"
        >
          Create an Account
        </Link>
      </section>
    </div>
  );
}
