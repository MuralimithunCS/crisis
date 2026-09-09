import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Play, Loader2, Download, MapPin, Zap, Activity, Home } from 'lucide-react';
import { scenarioApi } from '../services/api';
import { MapView } from '../components/MapView';
import { SimulationResults, SimulationTimeline } from '../pages/Components';
import { Link } from 'react-router-dom';

const simulationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  disasterType: z.enum(['earthquake', 'flood', 'fire', 'cyclone', 'tsunami']),
  magnitude: z.number().min(1).max(10).optional(),
  waterLevel: z.number().min(0).max(20).optional(),
  windSpeed: z.number().min(0).max(300).optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    region: z.string()
  }),
  populationDensity: z.number().min(0)
});

type SimulationForm = z.infer<typeof simulationSchema>;

export function Simulation() {
  const [results, setResults] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  
  const form = useForm<SimulationForm>({
    resolver: zodResolver(simulationSchema),
    defaultValues: {
      disasterType: 'earthquake',
      magnitude: 6.0,
      populationDensity: 5000
    }
  });
  
  const disasterType = form.watch('disasterType');
  
  const runSimulation = useMutation({
    mutationFn: (data: SimulationForm) => scenarioApi.simulate(data),
    onSuccess: (data) => {
      setResults(data);
    }
  });
  
  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const location = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      setSelectedLocation(location);
      form.setValue('location', {
        ...location,
        region: 'Selected area'
      });
    }
  };
  
  const onSubmit = (data: SimulationForm) => {
    runSimulation.mutate(data);
  };

  const exportResults = () => {
     alert('Exporting simulation report to PDF...');
  };
  
  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans selection:bg-indigo-500/30 overflow-x-hidden pb-20">
      
      {/* Premium Header matching Dashboard */}
      <header className="fixed top-0 w-full z-50 bg-white/60 backdrop-blur-2xl border-b border-gray-200/50 shadow-sm transition-all text-gray-800">
        <div className="max-w-[1600px] mx-auto px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2.5 rounded-xl text-white shadow-lg shadow-purple-900/20 ring-1 ring-white/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
               <h1 className="text-[19px] leading-none font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">CrisisIQ</h1>
               <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-600">Simulation Engine</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <Link to="/dashboard" className="px-5 py-2 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-sm flex items-center gap-2 uppercase tracking-wide hover:bg-slate-200 transition-colors">
                 <Home className="w-3.5 h-3.5" /> Return to HQ
             </Link>
          </div>
        </div>
      </header>
      
      <main className="pt-28 max-w-[1600px] mx-auto px-6 animate-fade-in">
        
        {/* Header Title Space */}
        <div className="mb-8">
           <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">War Room Sandbox</h2>
           <p className="text-slate-500 font-medium mt-1">Model disaster scenarios to analyze structural and societal impacts instantly.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Form Configuration Column */}
          <div className="xl:col-span-1">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white p-6 ring-1 ring-slate-100 sticky top-28">
              <h2 className="text-sm font-extrabold text-slate-800 tracking-widest uppercase mb-6 flex items-center gap-2">
                 <Zap className="w-4 h-4 text-indigo-500" /> Scenario Matrix
              </h2>
              
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1 uppercase tracking-wider">
                    Codename
                  </label>
                  <input
                    {...form.register('name')}
                    className="w-full px-4 py-2.5 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-slate-800 text-sm"
                    placeholder="e.g., Operation Floodgate"
                  />
                  {form.formState.errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{form.formState.errors.name.message}</p>}
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1 uppercase tracking-wider">
                    Disaster Profile
                  </label>
                  <select
                    {...form.register('disasterType')}
                    className="w-full px-4 py-2.5 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-slate-800 text-sm appearance-none cursor-pointer"
                  >
                    <option value="earthquake">Seismic (Earthquake)</option>
                    <option value="flood">Hydro (Flood)</option>
                    <option value="fire">Thermal (Wildfire)</option>
                    <option value="cyclone">Atmospheric (Cyclone)</option>
                    <option value="tsunami">Oceanic (Tsunami)</option>
                  </select>
                </div>
                
                {(disasterType === 'earthquake' || disasterType === 'tsunami') && (
                  <div className="pt-2 animate-fade-in">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1 uppercase tracking-wider flex justify-between">
                      <span>Magnitude Level</span>
                      <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-extrabold">{form.watch('magnitude')?.toFixed(1)}</span>
                    </label>
                    <Controller
                      name="magnitude"
                      control={form.control}
                      render={({ field }) => (
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="0.1"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      )}
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                      <span>1.0</span>
                      <span>10.0</span>
                    </div>
                  </div>
                )}
                
                <div className="pt-4 pb-2">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-2">
                     <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                     <p className="text-xs font-semibold text-indigo-700 leading-tight">Click anywhere on the map strictly to define the simulation epicenter coordinate.</p>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={runSimulation.isPending || !selectedLocation}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3.5 px-4 rounded-xl hover:shadow-lg hover:shadow-indigo-600/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group"
                >
                  {runSimulation.isPending ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Computing...</>
                  ) : (
                    <><Play className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor"/> Run Simulation</>
                  )}
                </button>
              </form>
            </div>
          </div>
          
          {/* Main Visualizer Area */}
          <div className="xl:col-span-3 space-y-8">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white overflow-hidden relative group ring-1 ring-slate-100">
              <div className="px-6 py-4 border-b border-gray-100/50 flex justify-between items-center bg-gradient-to-r from-white to-slate-50">
                <h2 className="text-sm font-extrabold text-slate-800 tracking-widest uppercase flex items-center gap-2">
                   <MapPin className="w-4 h-4 text-purple-500" /> Geographic Area Target
                </h2>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border shadow-inner transition-colors ${selectedLocation ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                  {selectedLocation ? 'Coordinates Locked' : 'Awaiting Input'}
                </span>
              </div>
              <div className="h-[500px] w-full relative bg-slate-100 cursor-crosshair">
                <MapView
                  alerts={results || selectedLocation ? [{
                    _id: 'simulation',
                    type: disasterType,
                    severity: 'critical',
                    title: 'Simulation Epicenter',
                    location: {
                      coordinates: [selectedLocation?.lng || 0, selectedLocation?.lat || 0]
                    },
                    affectedRadius: results?.results?.affected_radius || 50
                  }] : []}
                  height="500px"
                  showControls
                  onMapClick={handleMapClick}
                />
              </div>
            </div>
            
            {results && (
              <div className="space-y-6">
                <SimulationResults results={results.results} />
                <SimulationTimeline timeline={results.timeline} />
                
                <div className="flex justify-end pt-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <button
                    onClick={exportResults}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white text-slate-700 font-bold border border-slate-200 hover:bg-slate-50 hover:shadow shadow-sm rounded-xl transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download Tactical Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
