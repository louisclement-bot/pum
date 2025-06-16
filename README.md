# PUM Rainwater Harvesting Simulator

A comprehensive web application that helps users calculate the optimal rainwater harvesting system for their needs, based on their location, roof surface area, water usage patterns, and local rainfall data.

![PUM Rainwater Simulator](https://placeholder.svg?height=400&width=800&query=PUM%20Rainwater%20Simulator%20Dashboard)

## 🌧️ Overview

The PUM Rainwater Harvesting Simulator is a step-by-step configurator that guides users through the process of determining the most suitable rainwater collection system for their property. By analyzing factors such as roof surface area, local rainfall patterns, household size, and intended water usage, the application provides personalized recommendations for tank size, potential water savings, and suitable products.

## ✨ Features

### 🎯 Comprehensive Data Collection
- **Usage Selection**: Define how you plan to use collected rainwater (garden irrigation, toilet flushing, washing machine)
- **Building Information**: Input roof surface area manually or search by address with automatic calculation
- **Rainfall Data**: Automatically fetch local rainfall data based on location using Open-Meteo API
- **Autonomy Selection**: Choose desired water autonomy period (1-4 weeks)

### 🏠 Building & Address Integration
- Address search with autocomplete using BAN (Base Adresse Nationale)
- Interactive building selection from map interface
- Automatic roof surface calculation using geospatial data
- Integration with BDNB (Base de Données Nationale des Bâtiments)
- Support for multiple building data sources (BDNB, IGN, OSM)

### 📊 Advanced Calculations & Visualizations
- Annual water collection potential calculation
- Water needs assessment based on usage patterns
- Coverage rate calculation and optimization
- Potential savings in both water volume and euros
- Monthly rainfall charts and detailed data tables
- Cumulative rainfall visualization
- Precipitation composition analysis (rain vs snow)

### 💰 Financial & Product Guidance
- Financial aid information based on user location
- Recommended tank sizes based on precise calculations
- Product recommendations for both aerial and buried tanks
- Compatible pump suggestions based on intended usage
- Detailed product features, benefits, and pricing

### 📱 User Experience
- Fully responsive design for all devices
- Dark/light mode toggle with system preference detection
- Step-by-step guided process with progress tracking
- Navigation history for seamless back/forward movement
- Results sharing and PDF export capabilities
- Accessibility-compliant interface

## 🛠️ Technical Architecture

### Frontend Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Hooks with context patterns
- **UI Components**: Custom components built on shadcn/ui foundation

### Data Visualization & Mapping
- **Charts**: Recharts library for interactive data visualization
- **Maps**: Leaflet with React-Leaflet for building selection
- **PDF Generation**: jsPDF with jsPDF-autotable for reports
- **Geospatial**: Turf.js for geometric calculations

### External API Integrations
- **Weather Data**: Open-Meteo API for detailed rainfall information
- **Building Data**: BDNB API for French building database
- **Geocoding**: BAN API for French address search and validation
- **Coordinate Systems**: Proj4 for Lambert-93 to WGS84 transformations

## 📁 Project Structure

\`\`\`
├── app/                           # Next.js App Router
│   ├── api/                       # API routes
│   │   ├── roof-details/          # Building roof details endpoint
│   │   └── roof-surface/          # Roof surface calculation endpoint
│   ├── globals.css                # Global styles and Tailwind imports
│   ├── layout.tsx                 # Root layout with theme provider
│   └── page.tsx                   # Main application entry point
│
├── components/                    # React components
│   ├── address/                   # Address search functionality
│   │   ├── building/              # Building selection components
│   │   ├── containers/            # Container components with context
│   │   ├── fields/                # Form field components
│   │   └── ui/                    # Address-specific UI components
│   ├── icons/                     # Custom SVG icons as React components
│   ├── map/                       # Map-related components and utilities
│   │   ├── building-map.tsx       # Interactive building map
│   │   ├── coordinate-utils.ts    # Coordinate transformation utilities
│   │   ├── geo-json-utils.ts      # GeoJSON processing utilities
│   │   ├── map-component.tsx      # Main map component
│   │   ├── proj4-loader.ts        # Projection system loader
│   │   ├── turf-utils.ts          # Geometric calculation utilities
│   │   └── types.ts               # Map-related type definitions
│   ├── rainfall-charts/           # Rainfall data visualization
│   │   ├── cumulative-rainfall-chart.tsx
│   │   ├── monthly-rainfall-chart.tsx
│   │   ├── precipitation-composition-chart.tsx
│   │   └── rainfall-data-table.tsx
│   ├── steps/                     # Wizard step components
│   │   ├── address-input.tsx      # Address input step
│   │   ├── address-input-refactored.tsx
│   │   ├── autonomy-selection.tsx # Water autonomy selection
│   │   ├── financial-aid.tsx      # Financial assistance information
│   │   ├── garden-surface.tsx     # Garden surface area input
│   │   ├── household-size.tsx     # Household size configuration
│   │   ├── rainfall.tsx           # Rainfall data collection
│   │   ├── recommended-products.tsx # Product recommendations
│   │   ├── results.tsx            # Final results and calculations
│   │   ├── roof-surface-input.tsx # Manual roof surface input
│   │   ├── roof-surface-question.tsx # Roof knowledge question
│   │   ├── roof-surface-question-fixed.tsx
│   │   ├── roof-type.tsx          # Roof type selection
│   │   ├── surface-confirmation.tsx # Surface area confirmation
│   │   └── usage-selection.tsx    # Water usage selection
│   ├── ui/                        # Reusable UI components (shadcn/ui)
│   │   ├── alert.tsx              # Alert component
│   │   ├── slider.tsx             # Range slider component
│   │   ├── table.tsx              # Data table component
│   │   └── tabs.tsx               # Tab navigation component
│   ├── ui-elements/               # Custom UI elements
│   │   ├── address-autocomplete.tsx
│   │   ├── building-selection-card.tsx
│   │   ├── building-selection-list.tsx
│   │   ├── number-input.tsx
│   │   ├── pum-logo.tsx
│   │   ├── selected-building-summary.tsx
│   │   ├── step-buttons.tsx
│   │   └── theme-toggle.tsx
│   ├── mobile-progress-bar.tsx    # Mobile progress indicator
│   ├── progress-bar.tsx           # Desktop progress sidebar
│   ├── rainfall-details.tsx       # Detailed rainfall information
│   └── rainwater-simulator.tsx    # Main simulator component
│
├── constants/                     # Application constants
│   ├── api.ts                     # API endpoints and configuration
│   ├── calculations.ts            # Calculation constants and formulas
│   ├── index.ts                   # Exported constants
│   ├── steps.ts                   # Step configuration
│   └── ui.ts                      # UI-related constants
│
├── contexts/                      # React contexts
│   └── AddressSearchContext.tsx   # Address search state management
│
├── hooks/                         # Custom React hooks
│   ├── use-debounce.ts           # Debouncing utility hook
│   └── use-media-query.ts        # Responsive design hook
│
├── lib/                          # Utility functions and services
│   ├── buildingService.ts        # Building data retrieval
│   ├── buildingServiceTypes.ts   # Building service type definitions
│   ├── geocodeService.ts         # Address geocoding utilities
│   ├── pluvioService.ts          # Rainfall data service
│   ├── productService.ts         # Product recommendation service
│   ├── rainfallDataService.ts    # Rainfall data processing
│   ├── rnbIdService.ts           # RNB ID resolution service
│   ├── roofCalculator.ts         # Roof surface area calculations
│   ├── roofDetailsService.ts     # Roof details retrieval
│   ├── roofSurfaceByAddressService.ts
│   ├── roofSurfaceByCleInteropService.ts
│   └── utils.ts                  # General utility functions
│
├── public/                       # Static assets
│   ├── data/                     # JSON data files
│   │   └── products.json         # Product catalog
│   ├── icons/                    # SVG icon assets
│   │   ├── flat-roof.svg
│   │   ├── four-sided-roof.svg
│   │   ├── toilet.svg
│   │   ├── two-sided-roof.svg
│   │   ├── washing-machine.svg
│   │   ├── watering-can.svg
│   │   ├── watering-plant-icon.svg
│   │   └── water-plant-icon.svg
│   ├── images/                   # Image assets
│   │   └── pum-logo.svg
│   └── leaflet/                  # Leaflet map assets
│       ├── marker-icon.png
│       ├── marker-icon-2x.png
│       └── marker-shadow.png
│
├── services/                     # Service layer
│   ├── addressSearchService.ts   # Address search functionality
│   └── roofDetailsService.ts     # Roof details service
│
├── types/                        # TypeScript type definitions
│   └── addressTypes.ts           # Address-related types
│
├── package.json                  # Dependencies and scripts
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
\`\`\`

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18.x or later
- **Package Manager**: npm, yarn, or pnpm
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

### Installation

1. **Clone the repository**:
   \`\`\`bash
   git clone https://github.com/yourusername/pum-rainwater-simulator.git
   cd pum-rainwater-simulator
   \`\`\`

2. **Install dependencies**:
   \`\`\`bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   \`\`\`

3. **Set up environment variables** (optional):
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   
   Edit `.env.local` with your configuration:
   \`\`\`env
   NEXT_PUBLIC_OPEN_METEO_API_URL=https://archive-api.open-meteo.com/v1/archive
   NEXT_PUBLIC_GEOCODE_API_URL=https://api.bdnb.io/v1/bdnb/geocodage
   \`\`\`

4. **Run the development server**:
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   \`\`\`

5. **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000)

### Production Build

To create an optimized production build:

\`\`\`bash
npm run build
npm start
\`\`\`

## 📊 Calculation Methodology

The simulator uses scientifically-backed formulas to calculate rainwater collection potential:

### Water Collection Formula
\`\`\`
Annual Water Collectable (L) = Roof Surface (m²) × Annual Rainfall (mm) × Runoff Coefficient × Filter Efficiency
\`\`\`

**Where**:
- **Runoff Coefficient**: 0.8 (accounts for evaporation, absorption, and spillage)
- **Filter Efficiency**: 0.9 (accounts for water loss in filtration systems)

### Tank Size Recommendation
Tank size is calculated based on:
- **Water usage patterns** (garden, toilet, washing machine)
- **Desired autonomy period** (1-4 weeks)
- **Local rainfall distribution** (seasonal variations)
- **Household size** (for toilet and washing machine usage)

### Water Needs Calculation
- **Garden irrigation**: 5L/m²/week during growing season
- **Toilet flushing**: 30L/person/day
- **Washing machine**: 50L/cycle (estimated cycles per household size)

## 🔧 Configuration

### Tailwind CSS
The project uses a custom Tailwind configuration with:
- Custom color palette optimized for the water theme
- Extended font families (Inter, Montserrat)
- Custom animations and transitions
- Dark mode support

### TypeScript
Strict TypeScript configuration with:
- Path mapping for clean imports (`@/components`, `@/lib`, etc.)
- Comprehensive type definitions for all data structures
- API response type safety

## 🌐 API Integration

### Open-Meteo Weather API
- **Purpose**: Fetch detailed rainfall data
- **Data**: Daily precipitation, rain, and snow measurements
- **Coverage**: Global weather data with high accuracy
- **Rate Limits**: Free tier with reasonable limits

### BDNB Building Database
- **Purpose**: French building information and roof surface data
- **Data**: Building footprints, surface areas, construction details
- **Coverage**: Comprehensive French building database
- **Authentication**: Public API with usage guidelines

### BAN Address API
- **Purpose**: French address geocoding and validation
- **Data**: Coordinates, postal codes, city information
- **Coverage**: Complete French address database
- **Performance**: Fast response times for autocomplete

## 🧪 Testing

The application includes comprehensive testing for:
- Component rendering and interactions
- Calculation accuracy and edge cases
- API integration and error handling
- Responsive design across devices

Run tests with:
\`\`\`bash
npm test
# or
yarn test
\`\`\`

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The application can be deployed on any platform supporting Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Use semantic commit messages
- Ensure responsive design compatibility
- Add appropriate error handling
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- **[Open-Meteo](https://open-meteo.com/)** - Weather data API
- **[BDNB](https://bdnb.io/)** - French building database
- **[BAN](https://adresse.data.gouv.fr/)** - French address database
- **[Leaflet](https://leafletjs.com/)** - Interactive mapping
- **[Recharts](https://recharts.org/)** - Data visualization
- **[shadcn/ui](https://ui.shadcn.com/)** - UI component foundation
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework

## 📞 Support

For support, questions, or feature requests:
- **Issues**: [GitHub Issues](https://github.com/yourusername/pum-rainwater-simulator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/pum-rainwater-simulator/discussions)
- **Email**: support@pum-simulator.com

---

**Built with ❤️ for sustainable water management**
