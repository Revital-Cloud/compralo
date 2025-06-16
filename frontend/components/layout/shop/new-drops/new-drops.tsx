"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Eye, Star } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { newDropsProducts, type Product } from "./mockData";

const NewDropsSection = () => {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 4;
  const maxIndex = Math.max(0, newDropsProducts.length - itemsPerPage);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const visibleProducts = newDropsProducts.slice(currentIndex, currentIndex + itemsPerPage);

  return (
    <section className="bg-gray-50 dark:bg-gray-900 py-16 px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
              DON'T MISS OUT
            </h2>
            <h3 className="text-4xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
              NEW DROPS
            </h3>
          </div>
          <Button 
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-all duration-300"
          >
            SHOP NEW DROPS
          </Button>
        </div>

        {/* Products Grid */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleProducts.map((product, index) => (
              <Card key={product.id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md dark:shadow-gray-900/25 transition-all duration-300 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  {/* Product Badge */}
                  {product.badge && (
                    <div className="flex justify-start mb-4">
                      <Badge className="bg-blue-600 dark:bg-blue-500 text-white text-xs px-3 py-1 rounded-full transition-colors duration-300">
                        {product.badge}
                      </Badge>
                    </div>
                  )}

                  {/* Product Image */}
                  <div className="relative mb-6 bg-gray-100 dark:bg-gray-700 rounded-xl aspect-square flex items-center justify-center transition-colors duration-300">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain p-4"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wide leading-tight transition-colors duration-300">
                      {product.name}
                    </h4>
                    
                    {/* Rating */}
                    {product.rating && (
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(product.rating!)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="text-sm text-gray-600 dark:text-gray-300 ml-1 transition-colors duration-300">
                          ({product.rating})
                        </span>
                      </div>
                    )}

                    {/* Pricing */}
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-gray-900 dark:text-white transition-colors duration-300">
                        ${product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 line-through transition-colors duration-300">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-0 h-auto font-medium transition-colors duration-300"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        VIEW PRODUCT - ${product.price}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Navigation Arrows */}
          {newDropsProducts.length > itemsPerPage && (
            <>
              <button
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg dark:shadow-gray-900/25 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 border border-gray-200 dark:border-gray-600"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300 transition-colors duration-300" />
              </button>
              
              <button
                onClick={nextSlide}
                disabled={currentIndex >= maxIndex}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg dark:shadow-gray-900/25 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 border border-gray-200 dark:border-gray-600"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300 transition-colors duration-300" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default NewDropsSection; 