import React from 'react'

const FeaturedCategoriesSkeleton = () => {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 overflow-hidden transition-colors duration-300">
    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.1)_50%,transparent_75%)] dark:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.05)_50%,transparent_75%)] bg-[length:20px_20px] animate-pulse" />
    
    <div className="relative container mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-48 mx-auto mb-4 animate-pulse" />
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-96 mx-auto mb-4 animate-pulse" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-64 mx-auto animate-pulse" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg dark:shadow-gray-900/25 border border-gray-200/50 dark:border-gray-700/50 transition-colors duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-xl animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16 animate-pulse" />
            </div>
            <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-2 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  </section>
  )
}

export default FeaturedCategoriesSkeleton
