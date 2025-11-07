import { motion } from 'framer-motion';
import { Target, Eye, Heart, Users } from 'lucide-react';

const cards = [
  {
    icon: Target,
    title: 'Our Mission',
    description: 'To provide exceptional handcrafted treasures while maintaining the highest standards of integrity, transparency, and customer satisfaction.',
    image: './mission.jpg'
  },
  {
    icon: Eye,
    title: 'Our Vision',
    description: 'To revolutionize the craft industry by combining traditional values with modern innovation, creating a seamless experience that sets new standards.',
    image: './vision.jpg'}
 
 
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

export default function MissionVision() {
  return (
    <section className="py-4 md:py-6 lg:py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6 md:mb-8 lg:mb-10"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-light tracking-tight text-gray-900 mb-2 md:mb-3">
            Our <span className="font-serif italic">Story</span>
          </h2>
          <div className="w-12 md:w-16 h-0.5 bg-gradient-to-r from-pink-600 to-pink-600 mx-auto mb-3 md:mb-4"></div>
          <p className="text-xs md:text-sm lg:text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
            Discover what drives us and shapes our commitment to excellence in every interaction
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 lg:gap-6 max-w-4xl mx-auto">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="group relative bg-white/80 backdrop-blur-sm rounded-lg md:rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-500 border border-white/20"
            >
              <div className="aspect-[4/2] md:aspect-[4/2.5] overflow-hidden">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              
              <div className="p-3 md:p-4 lg:p-5">
                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                  <div className="p-1.5 md:p-2 bg-gradient-to-br from-pink-100 to-pink-100 rounded-md md:rounded-lg shadow-sm">
                    <card.icon className="h-3 w-3 md:h-4 md:w-4 text-pink-700" />
                  </div>
                  <h3 className="text-sm md:text-lg lg:text-xl font-semibold text-gray-900">{card.title}</h3>
                </div>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{card.description}</p>
              </div>

              {/* Premium hover effect */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-pink-200 rounded-lg md:rounded-xl transition-colors duration-500 pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 
