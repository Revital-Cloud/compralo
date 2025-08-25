
const BgDecorativeElements = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
        {/* Enhanced gradient circles with movement */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#ec2538]/15 to-[#fec806]/15 rounded-full blur-3xl animate-pulse" style={{animationDuration: '8s'}}></div>
        <div className="absolute top-20 -left-20 w-60 h-60 bg-gradient-to-br from-[#FF8C00]/15 to-[#ec2538]/15 rounded-full blur-3xl animate-pulse" style={{animationDuration: '6s', animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-[#fec806]/25 to-[#FF8C00]/25 rounded-full blur-2xl animate-pulse" style={{animationDuration: '10s', animationDelay: '2s'}}></div>
        
        {/* New floating elements with smooth movement */}
        <div className="absolute top-10 left-1/4 w-32 h-32 bg-gradient-to-br from-[#ec2538]/5 to-[#FF8C00]/5 rounded-full blur-2xl animate-bounce" style={{animationDuration: '4s', animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-10 left-3/4 w-24 h-24 bg-gradient-to-br from-[#fec806]/8 to-[#ec2538]/8 rounded-full blur-xl animate-bounce" style={{animationDuration: '5s', animationDelay: '1.5s'}}></div>
        
        {/* Geometric lines with enhanced movement */}
        <div className="absolute top-0 left-0 w-full h-full">
          {/* Diagonal lines with floating effect */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-0 w-32 h-px bg-gradient-to-r from-transparent via-[#ec2538]/25 to-transparent transform -rotate-45 animate-pulse" style={{animationDuration: '3s'}}></div>
            <div className="absolute top-40 left-0 w-48 h-px bg-gradient-to-r from-transparent via-[#FF8C00]/25 to-transparent transform -rotate-45 animate-pulse" style={{animationDuration: '4s', animationDelay: '0.5s'}}></div>
            <div className="absolute top-60 left-0 w-24 h-px bg-gradient-to-r from-transparent via-[#fec806]/25 to-transparent transform -rotate-45 animate-pulse" style={{animationDuration: '5s', animationDelay: '1s'}}></div>
          </div>
          
          {/* Right side diagonal lines with movement */}
          <div className="absolute top-0 right-0 w-full h-full">
            <div className="absolute top-32 right-0 w-40 h-px bg-gradient-to-l from-transparent via-[#ec2538]/25 to-transparent transform rotate-45 animate-pulse" style={{animationDuration: '3.5s', animationDelay: '0.3s'}}></div>
            <div className="absolute top-64 right-0 w-32 h-px bg-gradient-to-l from-transparent via-[#FF8C00]/25 to-transparent transform rotate-45 animate-pulse" style={{animationDuration: '4.5s', animationDelay: '0.8s'}}></div>
            <div className="absolute top-96 right-0 w-56 h-px bg-gradient-to-l from-transparent via-[#fec806]/25 to-transparent transform rotate-45 animate-pulse" style={{animationDuration: '6s', animationDelay: '1.2s'}}></div>
          </div>
          
          {/* Horizontal accent lines with wave effect */}
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#ec2538]/15 to-transparent animate-pulse" style={{animationDuration: '7s'}}></div>
          <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#FF8C00]/15 to-transparent animate-pulse" style={{animationDuration: '8s', animationDelay: '1s'}}></div>
          
          {/* Vertical accent lines with breathing effect */}
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#fec806]/15 to-transparent animate-pulse" style={{animationDuration: '6s', animationDelay: '0.5s'}}></div>
          <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-[#ec2538]/15 to-transparent animate-pulse" style={{animationDuration: '5s', animationDelay: '1.5s'}}></div>
        </div>
        
        {/* Enhanced floating geometric shapes with smooth movement */}
        <div className="absolute top-32 left-16 w-4 h-4 bg-[#ec2538]/40 rounded-full animate-bounce" style={{animationDuration: '2s'}}></div>
        <div className="absolute top-48 left-32 w-3 h-3 bg-[#FF8C00]/40 rounded-full animate-bounce" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}></div>
        <div className="absolute top-64 left-8 w-2 h-2 bg-[#fec806]/40 rounded-full animate-bounce" style={{animationDuration: '3s', animationDelay: '1s'}}></div>
        
        <div className="absolute top-24 right-24 w-3 h-3 bg-[#ec2538]/40 rounded-full animate-bounce" style={{animationDuration: '2.2s', animationDelay: '0.3s'}}></div>
        <div className="absolute top-56 right-16 w-4 h-4 bg-[#FF8C00]/40 rounded-full animate-bounce" style={{animationDuration: '2.8s', animationDelay: '0.8s'}}></div>
        <div className="absolute top-80 right-32 w-2 h-2 bg-[#fec806]/40 rounded-full animate-bounce" style={{animationDuration: '3.2s', animationDelay: '1.2s'}}></div>
        
        {/* New moving elements */}
        <div className="absolute top-1/3 left-1/3 w-6 h-6 bg-[#ec2538]/30 rounded-full animate-pulse" style={{animationDuration: '4s', animationDelay: '0.2s'}}></div>
        <div className="absolute top-2/3 right-1/3 w-5 h-5 bg-[#FF8C00]/30 rounded-full animate-pulse" style={{animationDuration: '5s', animationDelay: '0.7s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-[#fec806]/35 rounded-full animate-bounce" style={{animationDuration: '2.5s', animationDelay: '0.4s'}}></div>
        
        {/* Additional floating elements for richness */}
        <div className="absolute top-16 left-1/2 w-4 h-4 bg-[#ec2538]/25 rounded-full animate-bounce" style={{animationDuration: '3s', animationDelay: '0.1s'}}></div>
        <div className="absolute top-32 right-1/3 w-3 h-3 bg-[#FF8C00]/30 rounded-full animate-pulse" style={{animationDuration: '4s', animationDelay: '0.6s'}}></div>
        <div className="absolute top-48 left-1/6 w-5 h-5 bg-[#fec806]/25 rounded-full animate-bounce" style={{animationDuration: '2.8s', animationDelay: '0.9s'}}></div>
        <div className="absolute top-64 right-1/6 w-2 h-2 bg-[#ec2538]/35 rounded-full animate-pulse" style={{animationDuration: '3.5s', animationDelay: '0.3s'}}></div>
        <div className="absolute top-80 left-2/3 w-4 h-4 bg-[#FF8C00]/20 rounded-full animate-bounce" style={{animationDuration: '2.2s', animationDelay: '0.7s'}}></div>
        <div className="absolute top-96 right-2/3 w-3 h-3 bg-[#fec806]/30 rounded-full animate-pulse" style={{animationDuration: '4.2s', animationDelay: '1.1s'}}></div>
        
        {/* Corner accent elements */}
        <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-[#ec2538]/10 to-transparent rounded-full animate-pulse" style={{animationDuration: '6s'}}></div>
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#FF8C00]/10 to-transparent rounded-full animate-pulse" style={{animationDuration: '7s', animationDelay: '1s'}}></div>
        <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-[#fec806]/10 to-transparent rounded-full animate-pulse" style={{animationDuration: '5s', animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-0 right-0 w-18 h-18 bg-gradient-to-tl from-[#ec2538]/10 to-transparent rounded-full animate-pulse" style={{animationDuration: '8s', animationDelay: '1.5s'}}></div>
        
        {/* Mid-section accent elements */}
        <div className="absolute top-1/4 left-0 w-8 h-8 bg-gradient-to-r from-[#FF8C00]/20 to-transparent rounded-full animate-bounce" style={{animationDuration: '3s', animationDelay: '0.2s'}}></div>
        <div className="absolute top-3/4 right-0 w-6 h-6 bg-gradient-to-l from-[#fec806]/20 to-transparent rounded-full animate-bounce" style={{animationDuration: '2.8s', animationDelay: '0.8s'}}></div>
        <div className="absolute top-1/2 left-0 w-5 h-5 bg-gradient-to-r from-[#ec2538]/25 to-transparent rounded-full animate-pulse" style={{animationDuration: '4s', animationDelay: '0.4s'}}></div>
        <div className="absolute top-1/2 right-0 w-7 h-7 bg-gradient-to-l from-[#FF8C00]/25 to-transparent rounded-full animate-pulse" style={{animationDuration: '3.5s', animationDelay: '1.2s'}}></div>
        
        {/* Diagonal accent lines for more structure */}
        <div className="absolute top-1/6 left-1/6 w-24 h-px bg-gradient-to-r from-transparent via-[#ec2538]/20 to-transparent transform rotate-45 animate-pulse" style={{animationDuration: '5s', animationDelay: '0.3s'}}></div>
        <div className="absolute top-5/6 right-1/6 w-20 h-px bg-gradient-to-l from-transparent via-[#FF8C00]/20 to-transparent transform -rotate-45 animate-pulse" style={{animationDuration: '4.5s', animationDelay: '0.9s'}}></div>
        <div className="absolute top-1/6 right-1/6 w-16 h-px bg-gradient-to-l from-transparent via-[#fec806]/20 to-transparent transform -rotate-45 animate-pulse" style={{animationDuration: '3.8s', animationDelay: '0.6s'}}></div>
        <div className="absolute top-5/6 left-1/6 w-28 h-px bg-gradient-to-r from-transparent via-[#ec2538]/20 to-transparent transform rotate-45 animate-pulse" style={{animationDuration: '6s', animationDelay: '1.3s'}}></div>
        
        {/* Small decorative dots scattered throughout */}
        <div className="absolute top-12 left-1/5 w-1.5 h-1.5 bg-[#ec2538]/40 rounded-full animate-pulse" style={{animationDuration: '2s', animationDelay: '0.1s'}}></div>
        <div className="absolute top-28 right-1/5 w-1 h-1 bg-[#FF8C00]/40 rounded-full animate-pulse" style={{animationDuration: '2.5s', animationDelay: '0.4s'}}></div>
        <div className="absolute top-44 left-4/5 w-1.5 h-1.5 bg-[#fec806]/40 rounded-full animate-pulse" style={{animationDuration: '1.8s', animationDelay: '0.7s'}}></div>
        <div className="absolute top-60 right-4/5 w-1 h-1 bg-[#ec2538]/40 rounded-full animate-pulse" style={{animationDuration: '2.2s', animationDelay: '0.2s'}}></div>
        <div className="absolute top-76 left-1/10 w-1.5 h-1.5 bg-[#FF8C00]/40 rounded-full animate-pulse" style={{animationDuration: '2.8s', animationDelay: '0.9s'}}></div>
        <div className="absolute top-92 right-1/10 w-1 h-1 bg-[#fec806]/40 rounded-full animate-pulse" style={{animationDuration: '2.1s', animationDelay: '0.5s'}}></div>
        
        {/* Grid pattern overlay with subtle movement */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full animate-pulse" style={{
            backgroundImage: `
              linear-gradient(rgba(236, 37, 56, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(236, 37, 56, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animationDuration: '20s'
          }}></div>
        </div>
      </div>
  )
}

export default BgDecorativeElements