"use client"

import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

const EcommerceHeroCarousel: React.FC = () => {
  return (
    <section className="relative w-full min-h-screen bg-[#F5F5F5]">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-400 mb-6">
              Shop the best deals
            </h1>
            <Button 
              size="lg" 
              className="bg-white hover:bg-gray-50 text-black font-semibold px-8 py-4 text-lg rounded-lg border border-black"
            >
              Shop now
            </Button>
          </div>
          
          {/* Right Content */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="w-64 h-64 bg-[#FF0000] rounded-full flex items-center justify-center">
                <div className="w-32 h-32 bg-[#FFD600] rounded-full flex items-center justify-center">
                  <ChevronDown className="w-16 h-16 text-black" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Categories */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-black mb-12">Featured categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* Electronics */}
          <div className="bg-[#FF7A00] rounded-lg p-8 text-center cursor-pointer hover:scale-105 transition-transform">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-10 h-10 bg-[#FF7A00] rounded"></div>
            </div>
            <span className="text-white font-semibold text-lg">Electronics</span>
          </div>
          
          {/* Home - Text Only */}
          <div className="flex items-center justify-center">
            <span className="text-black font-semibold text-lg">Home</span>
          </div>
          
          {/* Beauty */}
          <div className="bg-[#FFD600] rounded-lg p-8 text-center cursor-pointer hover:scale-105 transition-transform">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-10 h-10 bg-[#FFD600] rounded"></div>
            </div>
            <span className="text-black font-semibold text-lg">Beauty</span>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-black mb-12">Testimonials</h2>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Testimonial 1 */}
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-[#FF0000] rounded-full flex-shrink-0"></div>
            <div className="flex-1">
              <h4 className="font-semibold text-black mb-2">John Doe</h4>
              <p className="text-gray-700 mb-3">
                I had a great experience shopping on Compralo. The website is user-friendly and the products are of excellent quality.
              </p>
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-5 h-5 bg-[#FFD600] rounded-full"></div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Testimonial 2 */}
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-[#FF0000] rounded-full flex-shrink-0"></div>
            <div className="flex-1">
              <h4 className="font-semibold text-black mb-2">John Doe</h4>
              <p className="text-gray-700 mb-3">
                I had a great experience shopping on Compralo. The website is user-friendly and the products are of excellent quality.
              </p>
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-5 h-5 bg-[#FFD600] rounded-full"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Listings */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Product 1 - Laptop */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <div className="w-32 h-24 bg-gray-400 rounded flex items-center justify-center">
                <div className="w-16 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded"></div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-black mb-2">Laptop Pro 2023</h3>
              <p className="text-gray-600 mb-4">High-performance laptop for all your needs</p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-black">$999.99</span>
              </div>
              <Button className="w-full bg-[#FFD600] hover:bg-[#E6C200] text-black font-semibold">
                Add to Cart
              </Button>
            </div>
          </div>
          
          {/* Product 2 - Summer Dress */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded"></div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-black mb-2">Summer Dress</h3>
              <p className="text-gray-600 mb-4">Perfect for beach outings and casual wear</p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-black">$79.99</span>
              </div>
              <Button className="w-full bg-[#FFD600] hover:bg-[#E6C200] text-black font-semibold">
                Add to Cart
              </Button>
            </div>
          </div>
          
          {/* Product 3 - Beauty Kit */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-pink-200 to-rose-200 flex items-center justify-center">
              <div className="flex space-x-2">
                <div className="w-8 h-8 bg-pink-300 rounded"></div>
                <div className="w-8 h-8 bg-rose-300 rounded"></div>
                <div className="w-8 h-8 bg-pink-400 rounded"></div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-black mb-2">Beauty Kit</h3>
              <p className="text-gray-600 mb-4">Complete skincare solutions for radiant skin</p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-black">$45.59</span>
              </div>
              <Button className="w-full bg-[#FFD600] hover:bg-[#E6C200] text-black font-semibold">
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
        
        {/* Second Row - Same Products */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-8">
          {/* Product 1 - Laptop (Repeat) */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <div className="w-32 h-24 bg-gray-400 rounded flex items-center justify-center">
                <div className="w-16 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded"></div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-black mb-2">Laptop Pro 2023</h3>
              <p className="text-gray-600 mb-4">High-performance laptop for all your needs</p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-black">$999.99</span>
              </div>
              <Button className="w-full bg-[#FFD600] hover:bg-[#E6C200] text-black font-semibold">
                Add to Cart
              </Button>
            </div>
          </div>
          
          {/* Product 2 - Summer Dress (Repeat) */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded"></div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-black mb-2">Summer Dress</h3>
              <p className="text-gray-600 mb-4">Perfect for beach outings and casual wear</p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-black">$79.99</span>
              </div>
              <Button className="w-full bg-[#FFD600] hover:bg-[#E6C200] text-black font-semibold">
                Add to Cart
              </Button>
            </div>
          </div>
          
          {/* Product 3 - Beauty Kit (Repeat) */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-pink-200 to-rose-200 flex items-center justify-center">
              <div className="flex space-x-2">
                <div className="w-8 h-8 bg-pink-300 rounded"></div>
                <div className="w-8 h-8 bg-rose-300 rounded"></div>
                <div className="w-8 h-8 bg-pink-400 rounded"></div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-black mb-2">Beauty Kit</h3>
              <p className="text-gray-600 mb-4">Complete skincare solutions for radiant skin</p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-black">$45.59</span>
              </div>
              <Button className="w-full bg-[#FFD600] hover:bg-[#E6C200] text-black font-semibold">
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default EcommerceHeroCarousel
