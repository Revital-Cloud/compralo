"use client";

import { Card, CardContent } from "@/components/ui";
import { Badge } from "@/components/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";

interface Category {
  id: string;
  name: string;
  image: string;
  productCount?: number;
  featured?: boolean;
}

const categories: Category[] = [];

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
    <section className="bg-background py-16 px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-4xl font-bold text-foreground transition-colors duration-300">
            CATEGORIES
          </h2>
          
          {/* Navigation Controls */}
          {categories.length > itemsPerPage && (
            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className="w-10 h-10 bg-foreground/10 hover:bg-foreground/20 disabled:bg-foreground/5 disabled:opacity-50 rounded-full flex items-center justify-center transition-all duration-300 border border-foreground/20"
              >
                <ChevronLeft className="w-5 h-5 text-foreground transition-colors duration-300" />
              </button>
              
              <button
                onClick={nextSlide}
                disabled={currentIndex >= maxIndex}
                className="w-10 h-10 bg-foreground/10 hover:bg-foreground/20 disabled:bg-foreground/5 disabled:opacity-50 rounded-full flex items-center justify-center transition-all duration-300 border border-foreground/20"
              >
                <ChevronRight className="w-5 h-5 text-foreground transition-colors duration-300" />
              </button>
            </div>
          )}
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {visibleCategories.map((category, index) => (
            <Card 
              key={category.id} 
              className="bg-secondary rounded-3xl overflow-hidden hover:bg-secondary/90 transition-all duration-300 cursor-pointer group border-border"
            >
              <CardContent className="p-8 md:p-12">
                <div className="flex items-center justify-between h-full">
                  {/* Category Info */}
                  <div className="flex-1">
                    <div className="space-y-4">
                      <h3 className="text-2xl md:text-3xl font-bold text-secondary-foreground leading-tight transition-colors duration-300">
                        {category.name}
                      </h3>
                      
                      {/* Product Count */}
                      {category.productCount && (
                        <p className="text-muted-foreground text-lg transition-colors duration-300">
                          {category.productCount} productos disponibles
                        </p>
                      )}

                      {/* Featured Badge */}
                      {category.featured && (
                        <Badge className="bg-primary text-primary-foreground text-sm px-4 py-1 rounded-full transition-colors duration-300">
                          Destacado
                        </Badge>
                      )}

                      {/* Action Button */}
                      <div className="pt-4">
                        <button className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-all duration-300 group-hover:bg-primary/90">
                          Ver categoría
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Category Image */}
                  <div className="flex-shrink-0 ml-8">
                    <div className="w-48 h-48 md:w-56 md:h-56 bg-background rounded-2xl flex items-center justify-center overflow-hidden transition-colors duration-300 border-border">
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
                    ? "bg-foreground"
                    : "bg-foreground/30 hover:bg-foreground/50"
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