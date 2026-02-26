import React, { useState } from 'react';
import { 
  Search, 
  TrendingDown, 
  TrendingUp, 
  AlertCircle, 
  ExternalLink, 
  ShoppingBag, 
  History,
  BarChart3,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { analyzeProduct, type AnalysisResult } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await analyzeProduct(url);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError('Có lỗi xảy ra khi phân tích dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getPriceStatus = () => {
    if (!result) return null;
    const current = result.product.currentPrice;
    const others = result.comparisons.filter(c => !c.isCurrent).map(c => c.price);
    if (others.length === 0) return { label: 'Giá ổn định', color: 'text-blue-600', icon: CheckCircle2 };
    
    const avg = others.reduce((a, b) => a + b, 0) / others.length;
    if (current < avg * 0.9) return { label: 'Giá hời', color: 'text-emerald-600', icon: TrendingDown };
    if (current > avg * 1.1) return { label: 'Giá cao', color: 'text-rose-600', icon: TrendingUp };
    return { label: 'Giá hợp lý', color: 'text-amber-600', icon: CheckCircle2 };
  };

  const Status = getPriceStatus();

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <ShoppingBag className="text-white w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-neutral-900">PriceTracker <span className="text-orange-500">VN</span></h1>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-500">
            <a href="#" className="hover:text-neutral-900 transition-colors">Hướng dẫn</a>
            <a href="#" className="hover:text-neutral-900 transition-colors">Tiện ích</a>
            <a href="#" className="hover:text-neutral-900 transition-colors">Liên hệ</a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-12">
        {/* Search Section */}
        <section className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4 tracking-tight">
            Tra cứu lịch sử giá sản phẩm
          </h2>
          <p className="text-neutral-500 max-w-2xl mx-auto mb-8">
            Dán link sản phẩm từ Shopee, Lazada, Tiki... để so sánh giá với các shop khác và xem đánh giá từ AI.
          </p>
          
          <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto">
            <div className="relative group">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Dán link sản phẩm tại đây..."
                className="w-full h-14 pl-12 pr-32 bg-white border border-neutral-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-neutral-800"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5 group-focus-within:text-orange-500 transition-colors" />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 bottom-2 px-6 bg-orange-500 hover:bg-orange-600 disabled:bg-neutral-300 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tra cứu'}
              </button>
            </div>
          </form>
          
          {error && (
            <div className="mt-4 flex items-center justify-center gap-2 text-rose-600 text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </section>

        {/* Results Section */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Left Column: Product Info & Chart */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Card */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-6">
                  {result.product.imageUrl && (
                    <div className="w-full md:w-48 h-48 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                      <img 
                        src={result.product.imageUrl} 
                        alt={result.product.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs font-bold rounded uppercase tracking-wider">
                        {result.product.platform}
                      </span>
                      {Status && (
                        <div className={cn("flex items-center gap-1 text-sm font-bold", Status.color)}>
                          <Status.icon className="w-4 h-4" />
                          {Status.label}
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-2 leading-tight">
                      {result.product.name}
                    </h3>
                    <p className="text-neutral-500 text-sm mb-4">Shop: {result.product.shopName}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-orange-500">
                        {formatPrice(result.product.currentPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Comparison Chart */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="text-neutral-400 w-5 h-5" />
                    <h4 className="font-bold text-neutral-900">So sánh giá thị trường</h4>
                  </div>
                  <span className="text-xs text-neutral-400 font-medium">Đơn vị: VNĐ</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={[
                        { name: 'Shop hiện tại', price: result.product.currentPrice, isCurrent: true },
                        ...result.comparisons.filter(c => !c.isCurrent).map(c => ({
                          name: c.shop,
                          price: c.price,
                          isCurrent: false
                        }))
                      ]}
                      margin={{ top: 10, right: 10, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#888' }}
                        interval={0}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#888' }}
                        tickFormatter={(value) => `${value / 1000}k`}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f9fafb' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white border border-neutral-200 p-3 rounded-lg shadow-xl">
                                <p className="text-xs font-bold text-neutral-900 mb-1">{payload[0].payload.name}</p>
                                <p className="text-sm font-bold text-orange-500">{formatPrice(payload[0].value as number)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                        {[
                          { name: 'Shop hiện tại', price: result.product.currentPrice, isCurrent: true },
                          ...result.comparisons.filter(c => !c.isCurrent).map(c => ({
                            name: c.shop,
                            price: c.price,
                            isCurrent: false
                          }))
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.isCurrent ? '#f97316' : '#e5e5e5'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right Column: AI Analysis & List */}
            <div className="space-y-6">
              {/* AI Analysis */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <TrendingDown className="w-12 h-12 text-orange-500" />
                </div>
                <h4 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
                  <History className="text-orange-500 w-5 h-5" />
                  Phân tích từ AI
                </h4>
                <div className="markdown-body">
                  <Markdown>{result.summary}</Markdown>
                </div>
                <div className="mt-6 pt-6 border-t border-neutral-100">
                  <h5 className="text-sm font-bold text-neutral-900 mb-2">Lời khuyên:</h5>
                  <p className="text-sm text-neutral-600 italic">"{result.recommendation}"</p>
                </div>
              </div>

              {/* Similar Products List */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                <h4 className="font-bold text-neutral-900 mb-4">Các shop khác</h4>
                <div className="space-y-4">
                  {result.comparisons.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between group">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 truncate">{item.shop}</p>
                        <p className="text-xs text-neutral-500">{formatPrice(item.price)}</p>
                      </div>
                      {item.url && (
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400 hover:text-orange-500"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                  {result.comparisons.length === 0 && (
                    <p className="text-sm text-neutral-400 text-center py-4">Không tìm thấy shop tương tự.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!result && !loading && (
          <div className="mt-20 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
              <History className="text-neutral-300 w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">Bắt đầu tra cứu ngay</h3>
            <p className="text-neutral-500 max-w-sm">
              Nhập link sản phẩm để xem biến động giá và so sánh với các shop khác trên thị trường.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-neutral-200 py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm text-neutral-400 mb-2">© 2024 PriceTracker VN. Dữ liệu được phân tích bởi Google Gemini AI.</p>
          <p className="text-xs text-neutral-300">Công cụ này chỉ mang tính chất tham khảo. Vui lòng kiểm tra kỹ trước khi mua hàng.</p>
        </div>
      </footer>
    </div>
  );
}
