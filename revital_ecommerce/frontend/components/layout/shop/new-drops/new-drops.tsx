"use client";

import { Card, CardContent } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui";
import { ChevronLeft, ChevronRight, Eye, Star } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  badge?: string;
}

const newDropsProducts: Product[] = [];

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
    <section className="bg-secondary py-16 px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-bold text-foreground mb-2 transition-colors duration-300">
              DON'T MISS OUT
            </h2>
            <h3 className="text-4xl font-bold text-foreground transition-colors duration-300">
              NEW DROPS
            </h3>
          </div>
          <Button 
            variant="default"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-md transition-all duration-300"
          >
            SHOP NEW DROPS
          </Button>
        </div>

        {/* Products Grid */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleProducts.map((product, index) => (
              <Card key={product.id} className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md dark:shadow-gray-900/25 transition-all duration-300 border-border">
                <CardContent className="p-6">
                  {/* Product Badge */}
                  {product.badge && (
                    <div className="flex justify-start mb-4">
                      <Badge className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full transition-colors duration-300">
                        {product.badge}
                      </Badge>
                    </div>
                  )}

                  {/* Product Image */}
                  <div className="relative mb-6 bg-secondary rounded-xl aspect-square flex items-center justify-center transition-colors duration-300">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain p-4"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-foreground uppercase tracking-wide leading-tight transition-colors duration-300">
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
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                        <span className="text-sm text-muted-foreground ml-1 transition-colors duration-300">
                          ({product.rating})
                        </span>
                      </div>
                    )}

                    {/* Pricing */}
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-foreground transition-colors duration-300">
                        ${product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through transition-colors duration-300">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/90 p-0 h-auto font-medium transition-colors duration-300"
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
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-card rounded-full shadow-lg dark:shadow-gray-900/25 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-card/80 transition-all duration-300 border-border"
              >
                <ChevronLeft className="w-5 h-5 text-foreground/80 transition-colors duration-300" />
              </button>
              
              <button
                onClick={nextSlide}
                disabled={currentIndex >= maxIndex}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-card rounded-full shadow-lg dark:shadow-gray-900/25 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-card/80 transition-all duration-300 border-border"
              >
                <ChevronRight className="w-5 h-5 text-foreground/80 transition-colors duration-300" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default NewDropsSection; 