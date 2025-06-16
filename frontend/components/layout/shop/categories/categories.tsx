"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { categories, type Category } from "./mockData";

const CategoriesSection = () => {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 2;
  const maxIndex = Math.max(0, categories.length - itemsPerPage);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const visibleCategories = categories.slice(currentIndex, currentIndex + itemsPerPage);

  return (
    <section className="bg-black dark:bg-gray-950 py-16 px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-4xl font-bold text-white dark:text-gray-100 transition-colors duration-300">
            CATEGORIES
          </h2>
          
          {/* Navigation Controls */}
          {categories.length > itemsPerPage && (
            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className="w-10 h-10 bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:bg-gray-900 dark:disabled:bg-gray-800 disabled:opacity-50 rounded-full flex items-center justify-center transition-all duration-300 border border-gray-700 dark:border-gray-600"
              >
                <ChevronLeft className="w-5 h-5 text-white dark:text-gray-200 transition-colors duration-300" />
              </button>
              
              <button
                onClick={nextSlide}
                disabled={currentIndex >= maxIndex}
                className="w-10 h-10 bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:bg-gray-900 dark:disabled:bg-gray-800 disabled:opacity-50 rounded-full flex items-center justify-center transition-all duration-300 border border-gray-700 dark:border-gray-600"
              >
                <ChevronRight className="w-5 h-5 text-white dark:text-gray-200 transition-colors duration-300" />
              </button>
            </div>
          )}
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {visibleCategories.map((category, index) => (
            <Card 
              key={category.id} 
              className="bg-gray-100 dark:bg-gray-800 rounded-3xl overflow-hidden hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 cursor-pointer group border border-gray-200 dark:border-gray-700"
            >
              <CardContent className="p-8 md:p-12">
                <div className="flex items-center justify-between h-full">
                  {/* Category Info */}
                  <div className="flex-1">
                    <div className="space-y-4">
                      <h3 className="text-2xl md:text-3xl font-bold text-black dark:text-white leading-tight transition-colors duration-300">
                        {category.name}
                      </h3>
                      
                      {/* Product Count */}
                      {category.productCount && (
                        <p className="text-gray-600 dark:text-gray-300 text-lg transition-colors duration-300">
                          {category.productCount} productos disponibles
                        </p>
                      )}

                      {/* Featured Badge */}
                      {category.featured && (
                        <Badge className="bg-black dark:bg-gray-600 text-white dark:text-gray-100 text-sm px-4 py-1 rounded-full transition-colors duration-300">
                          Destacado
                        </Badge>
                      )}

                      {/* Action Button */}
                      <div className="pt-4">
                        <button className="bg-black dark:bg-gray-600 text-white dark:text-gray-100 px-6 py-3 rounded-full font-medium hover:bg-gray-800 dark:hover:bg-gray-500 transition-all duration-300 group-hover:bg-gray-800 dark:group-hover:bg-gray-500">
                          Ver categoría
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Category Image */}
                  <div className="flex-shrink-0 ml-8">
                    <div className="w-48 h-48 md:w-56 md:h-56 bg-white dark:bg-gray-700 rounded-2xl flex items-center justify-center overflow-hidden transition-colors duration-300 border border-gray-200 dark:border-gray-600">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-contain p-6 transform group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination Dots */}
        {categories.length > itemsPerPage && (
          <div className="flex justify-center mt-8 gap-2">
            {Array.from({ length: Math.ceil(categories.length / itemsPerPage) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index * itemsPerPage)}
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  Math.floor(currentIndex / itemsPerPage) === index
                    ? "bg-white dark:bg-gray-300"
                    : "bg-gray-600 dark:bg-gray-500 hover:bg-gray-500 dark:hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoriesSection; 