/**
 * CarbonDashboardPage — CO₂ impact charts and ESG stats
 */
import { useEffect, useState, useRef } from 'react';
import { userService } from '../services';
import { useAuth } from '../context/AuthContext';
import { MonthlyBarChart, CategoryPieChart } from '../components/CarbonChart';
import { Leaf, TreePine, Car, Plane, Home, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Equivalents calculation (same as backend util)
function equivalents(kg) {
  return {
    trees:  Math.round(kg / 22),
    carKm:  Math.round(kg / 0.17),
    flights: +(kg / 90).toFixed(1),
    days:   Math.round(kg / 12),
  };
}

const CarbonDashboardPage = () => {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const certificateRef = useRef(null);

  useEffect(() => {
    userService.getCarbon()
      .then(({ data: d }) => setData(d))
      .catch(() => toast.error('Failed to load carbon data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-eco-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const total = data?.totalCarbonSaved || 0;
  const eq    = equivalents(total);

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-3">
              <Leaf className="text-eco-500 w-8 h-8" /> Carbon Impact Dashboard
            </h1>
            <p className="text-eco-700 mt-1">Your personal environmental contribution through EcoLoop.</p>
          </div>
          
          {total > 0 && (
            <button
              onClick={async () => {
                if (!certificateRef.current) return;
                setGeneratingPdf(true);
                toast.loading('Generating certificate...', { id: 'pdf' });
                try {
                  const canvas = await html2canvas(certificateRef.current, { scale: 2, useCORS: true });
                  const imgData = canvas.toDataURL('image/png');
                  const pdf = new jsPDF('landscape', 'mm', 'a4');
                  const pdfWidth = pdf.internal.pageSize.getWidth();
                  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                  pdf.save(`Ecoloop_Green_Certificate_${data?.user?.name || 'User'}.pdf`);
                  toast.success('Certificate downloaded successfully!', { id: 'pdf' });
                } catch (err) {
                  console.error(err);
                  toast.error('Failed to generate certificate', { id: 'pdf' });
                } finally {
                  setGeneratingPdf(false);
                }
              }}
              disabled={generatingPdf}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {generatingPdf ? 'Generating...' : 'Download Certificate'}
            </button>
          )}
        </div>

        {total === 0 ? (
          <div className="glass-card p-16 text-center">
            <Leaf className="w-14 h-14 mx-auto text-eco-800 mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">No data yet</h2>
            <p className="text-eco-700">Complete your first transaction to see your carbon impact!</p>
          </div>
        ) : (
          <>
            {/* Hero stat */}
            <div className="glass-card p-8 mb-6 text-center border-eco-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-eco-500/5 to-transparent" />
              <div className="relative">
                <div className="font-display text-6xl font-extrabold gradient-text mb-2">
                  {total.toLocaleString()} kg
                </div>
                <div className="text-eco-700 text-lg">Total CO₂ Saved</div>
                <div className="text-sm text-eco-800 mt-1">across {data?.totalTransactions} completed transactions</div>
              </div>
            </div>

            {/* Equivalents */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { icon: <TreePine className="w-5 h-5" />, value: eq.trees.toLocaleString(),  label: 'Trees planted equiv.' },
                { icon: <Car      className="w-5 h-5" />, value: eq.carKm.toLocaleString(),  label: 'Car km avoided' },
                { icon: <Plane    className="w-5 h-5" />, value: eq.flights,                 label: 'Flight hours offset' },
                { icon: <Home     className="w-5 h-5" />, value: eq.days.toLocaleString(),   label: 'Household days offset' },
              ].map((e) => (
                <div key={e.label} className="glass-card p-4 text-center">
                  <div className="w-10 h-10 rounded-xl bg-eco-500/10 border border-eco-500/20 flex items-center justify-center text-eco-400 mx-auto mb-2">
                    {e.icon}
                  </div>
                  <div className="font-display font-bold text-lg">{e.value}</div>
                  <div className="text-xs text-eco-700">{e.label}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              {data?.monthlyData?.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="font-display font-semibold mb-4">Monthly CO₂ Savings</h3>
                  <MonthlyBarChart data={data.monthlyData} />
                </div>
              )}
              {data?.categoryData?.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="font-display font-semibold mb-4">Savings by Category</h3>
                  <CategoryPieChart data={data.categoryData} />
                </div>
              )}
            </div>

            {/* ESG indicator */}
            <div className="glass-card p-6 mt-6 border-eco-500/20">
              <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-eco-500" /> ESG Score Indicator
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-dark-300 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-eco-600 to-eco-400 transition-all duration-1000"
                    style={{ width: `${Math.min(100, (total / 10000) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-eco-400">
                  {total >= 10000 ? 'Excellent' : total >= 5000 ? 'Good' : total >= 1000 ? 'Fair' : 'Building'}
                </span>
              </div>
              <p className="text-xs text-eco-800 mt-2">
                Save 10,000+ kg CO₂ to reach Excellent ESG rating.
              </p>
            </div>

            {/* Hidden Certificate DOM for html2canvas */}
            <div className="overflow-hidden h-0 w-0 absolute opacity-0 pointer-events-none">
              <div
                ref={certificateRef}
                style={{
                  width: '1122px', // A4 Landscape roughly
                  height: '793px',
                  background: 'linear-gradient(135deg, #0f130f 0%, #1a241a 100%)',
                  padding: '60px',
                  position: 'relative',
                  fontFamily: 'Inter, sans-serif',
                  color: '#e8f5e9',
                  border: '15px solid #22c55e',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ position: 'absolute', top: '40px', left: '60px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <Leaf size={40} color="#22c55e" />
                  <span style={{ fontSize: '32px', fontWeight: 'bold', letterSpacing: '-1px' }}>EcoLoop</span>
                </div>
                
                <div style={{ position: 'absolute', top: '40px', right: '60px', textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', color: '#86efac' }}>Certificate ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
                  <div style={{ fontSize: '14px', color: '#a3a3a3' }}>Date: {new Date().toLocaleDateString()}</div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '120px' }}>
                  <h1 style={{ fontSize: '56px', fontWeight: '800', marginBottom: '20px', color: '#4ade80' }}>
                    CERTIFICATE OF SUSTAINABILITY
                  </h1>
                  <p style={{ fontSize: '24px', color: '#a3a3a3', marginBottom: '40px' }}>
                    This certifies that
                  </p>
                  <h2 style={{ fontSize: '44px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '2px solid #22c55e', display: 'inline-block', paddingBottom: '10px' }}>
                    {user?.companyName || user?.name || 'Valued Partner'}
                  </h2>
                  {user?.companyName && (
                    <div style={{ fontSize: '20px', color: '#86efac', marginBottom: '8px' }}>
                      {user.name}
                    </div>
                  )}
                  <div style={{ fontSize: '16px', color: '#4ade80', marginBottom: '30px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                    {user?.role === 'seller' ? 'Waste Material Supplier' : 'Circular Economy Buyer'}
                  </div>
                  <p style={{ fontSize: '24px', color: '#a3a3a3', marginBottom: '40px', maxWidth: '800px', margin: '0 auto 40px auto', lineHeight: '1.5' }}>
                    has demonstrated outstanding commitment to the circular economy by actively participating in waste diversion and material reuse.
                  </p>
                  
                  <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '20px', padding: '30px', display: 'inline-block' }}>
                    <div style={{ fontSize: '20px', color: '#86efac', marginBottom: '10px' }}>Total Carbon Emissions Prevented</div>
                    <div style={{ fontSize: '64px', fontWeight: '900', color: '#22c55e' }}>{total.toLocaleString()} kg CO₂</div>
                  </div>
                </div>

                <div style={{ position: 'absolute', bottom: '60px', left: '60px' }}>
                  <div style={{ borderTop: '2px solid #4ade80', width: '200px', paddingTop: '10px', fontSize: '18px', fontWeight: 'bold' }}>
                    EcoLoop Authority
                  </div>
                </div>
                
                <div style={{ position: 'absolute', bottom: '60px', right: '60px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ade80' }}>Verified Impact</div>
                    <div style={{ fontSize: '14px', color: '#a3a3a3' }}>Blockchain-backed Traceability</div>
                  </div>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '2px dashed #4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Leaf size={40} color="#4ade80" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CarbonDashboardPage;
