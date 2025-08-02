import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  DollarSign, 
  Clock, 
  User,
  Package,
  Save,
  X,
  Minus,
  Calculator,
  CreditCard,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ShoppingCart
} from 'lucide-react';
import { RestaurantTable, TableSale, TableSaleItem, TableCartItem } from '../../types/table-sales';

interface TableSalesPanelProps {
  storeId: 1 | 2;
  operatorName?: string;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName }) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [cartItems, setCartItems] = useState<TableCartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerCount, setCustomerCount] = useState(1);
  const [paymentType, setPaymentType] = useState<'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto'>('dinheiro');
  const [changeAmount, setChangeAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);

  // Check Supabase configuration
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const isConfigured = supabaseUrl && supabaseKey && 
                        supabaseUrl !== 'your_supabase_url_here' && 
                        supabaseKey !== 'your_supabase_anon_key_here' &&
                        !supabaseUrl.includes('placeholder');
    
    setSupabaseConfigured(isConfigured);
  }, []);

  const tableName = storeId === 1 ? 'store1_tables' : 'store2_tables';
  const salesTableName = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
  const itemsTableName = storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabaseConfigured) {
        console.warn('⚠️ Supabase não configurado - usando dados de demonstração');
        
        // Dados de demonstração
        const demoTables: RestaurantTable[] = [
          {
            id: '1',
            number: 1,
            name: 'Mesa 1',
            capacity: 4,
            status: 'livre',
            location: 'Área interna',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            number: 2,
            name: 'Mesa 2',
            capacity: 2,
            status: 'ocupada',
            location: 'Área externa',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        setTables(demoTables);
        setLoading(false);
        return;
      }

      console.log(`🔄 Carregando mesas da Loja ${storeId}...`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select(`
          *,
          current_sale:${salesTableName}(*)
        `)
        .eq('is_active', true)
        .order('number');

      if (error) throw error;

      setTables(data || []);
      console.log(`✅ ${data?.length || 0} mesas carregadas da Loja ${storeId}`);
    } catch (err) {
      console.error(`❌ Erro ao carregar mesas da Loja ${storeId}:`, err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar mesas');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'livre': return 'bg-green-100 text-green-800 border-green-200';
      case 'ocupada': return 'bg-red-100 text-red-800 border-red-200';
      case 'aguardando_conta': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'limpeza': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'livre': return 'Livre';
      case 'ocupada': return 'Ocupada';
      case 'aguardando_conta': return 'Aguardando Conta';
      case 'limpeza': return 'Limpeza';
      default: return status;
    }
  };

  const addItemToCart = (productCode: string, productName: string, unitPrice: number) => {
    const existingItem = cartItems.find(item => item.product_code === productCode);
    
    if (existingItem) {
      setCartItems(prev => prev.map(item => 
        item.product_code === productCode 
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price! }
          : item
      ));
    } else {
      const newItem: TableCartItem = {
        product_code: productCode,
        product_name: productName,
        quantity: 1,
        unit_price: unitPrice,
        subtotal: unitPrice
      };
      setCartItems(prev => [...prev, newItem]);
    }
  };

  const updateItemQuantity = (productCode: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCartItems(prev => prev.filter(item => item.product_code !== productCode));
    } else {
      setCartItems(prev => prev.map(item => 
        item.product_code === productCode 
          ? { ...item, quantity: newQuantity, subtotal: newQuantity * (item.unit_price || 0) }
          : item
      ));
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.subtotal, 0);
  };

  const openSaleModal = (table: RestaurantTable) => {
    setSelectedTable(table);
    setShowSaleModal(true);
    setCartItems([]);
    setCustomerName('');
    setCustomerCount(1);
    setPaymentType('dinheiro');
    setChangeAmount(0);
    setNotes('');
  };

  const closeSaleModal = () => {
    setShowSaleModal(false);
    setSelectedTable(null);
    setCartItems([]);
  };

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.number.toString().includes(searchTerm)
  );

  useEffect(() => {
    fetchTables();
  }, [storeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando mesas da Loja {storeId}...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Supabase Configuration Warning */}
      {!supabaseConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 rounded-full p-2">
              <AlertCircle size={20} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="font-medium text-yellow-800">Modo Demonstração</h3>
              <p className="text-yellow-700 text-sm">
                Supabase não configurado. Funcionalidades limitadas para Loja {storeId}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Users size={24} className="text-indigo-600" />
            Vendas de Mesa - Loja {storeId}
          </h2>
          <p className="text-gray-600">Gerencie vendas presenciais por mesa</p>
        </div>
        <button
          onClick={fetchTables}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar mesa..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTables.map((table) => (
          <div
            key={table.id}
            className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all hover:shadow-md ${getStatusColor(table.status)}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{table.name}</h3>
                <p className="text-sm text-gray-600">Capacidade: {table.capacity} pessoas</p>
                {table.location && (
                  <p className="text-xs text-gray-500">{table.location}</p>
                )}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(table.status)}`}>
                {getStatusLabel(table.status)}
              </div>
            </div>

            {table.current_sale && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Venda Ativa</p>
                <p className="text-xs text-gray-600">Cliente: {table.current_sale.customer_name || 'Não informado'}</p>
                <p className="text-sm font-bold text-green-600">
                  Total: {formatPrice(table.current_sale.total_amount)}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => openSaleModal(table)}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Calculator size={16} />
                {table.status === 'livre' ? 'Nova Venda' : 'Gerenciar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTables.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Nenhuma mesa encontrada
          </h3>
          <p className="text-gray-500">
            {searchTerm ? 'Tente ajustar o termo de busca' : `Nenhuma mesa cadastrada para a Loja ${storeId}`}
          </p>
        </div>
      )}

      {/* Sale Modal */}
      {showSaleModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 rounded-full p-2">
                    <Users size={24} className="text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Gerenciar Venda - {selectedTable.name}
                    </h2>
                    <p className="text-gray-600">
                      Loja {storeId} • Capacidade: {selectedTable.capacity} pessoas
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeSaleModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content - Grid Layout */}
            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-3 h-full">
                {/* Left Side - Products and Customer Info (2/3) */}
                <div className="col-span-2 p-6 overflow-y-auto">
                  {/* Customer Information */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                      <User size={20} />
                      Informações do Cliente
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">
                          Nome do Cliente
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full p-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="Nome do cliente"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">
                          Número de Pessoas
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={selectedTable.capacity}
                          value={customerCount}
                          onChange={(e) => setCustomerCount(parseInt(e.target.value) || 1)}
                          className="w-full p-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Add Items */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
                    <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                      <Package size={20} />
                      Adicionar Itens
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-green-700 mb-1">
                          Código do Produto
                        </label>
                        <input
                          type="text"
                          className="w-full p-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                          placeholder="Digite o código"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-green-700 mb-1">
                          Nome do Produto
                        </label>
                        <input
                          type="text"
                          className="w-full p-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                          placeholder="Nome do produto"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => addItemToCart('ACAI300', 'Açaí 300ml', 15.90)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Açaí 300ml - R$ 15,90
                      </button>
                      <button
                        onClick={() => addItemToCart('ACAI500', 'Açaí 500ml', 22.90)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Açaí 500ml - R$ 22,90
                      </button>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
                      <CreditCard size={20} />
                      Informações de Pagamento
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-purple-700 mb-1">
                          Forma de Pagamento
                        </label>
                        <select
                          value={paymentType}
                          onChange={(e) => setPaymentType(e.target.value as any)}
                          className="w-full p-3 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        >
                          <option value="dinheiro">Dinheiro</option>
                          <option value="pix">PIX</option>
                          <option value="cartao_credito">Cartão de Crédito</option>
                          <option value="cartao_debito">Cartão de Débito</option>
                          <option value="voucher">Voucher</option>
                          <option value="misto">Misto</option>
                        </select>
                      </div>
                      {paymentType === 'dinheiro' && (
                        <div>
                          <label className="block text-sm font-medium text-purple-700 mb-1">
                            Troco para
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={changeAmount}
                            onChange={(e) => setChangeAmount(parseFloat(e.target.value) || 0)}
                            className="w-full p-3 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            placeholder="Valor para troco"
                          />
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-purple-700 mb-1">
                        Observações
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-3 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white resize-none"
                        rows={3}
                        placeholder="Observações da venda..."
                      />
                    </div>
                  </div>
                </div>

                {/* Right Side - Cart Sidebar (1/3) */}
                <div className="col-span-1 bg-gradient-to-b from-gray-50 to-gray-100 border-l border-gray-200 flex flex-col">
                  {/* Cart Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <ShoppingCart size={20} className="text-indigo-600" />
                        Carrinho da Venda
                      </h3>
                      <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                        {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <p><strong>Mesa:</strong> {selectedTable.name}</p>
                      <p><strong>Cliente:</strong> {customerName || 'Não informado'}</p>
                    </div>
                  </div>

                  {/* Cart Items - Scrollable */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {cartItems.length === 0 ? (
                      <div className="text-center py-8">
                        <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 text-sm">Carrinho vazio</p>
                        <p className="text-gray-400 text-xs">Adicione produtos para começar</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cartItems.map((item, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-800 text-sm">{item.product_name}</h4>
                                <p className="text-xs text-gray-500">Código: {item.product_code}</p>
                                {item.unit_price && (
                                  <p className="text-xs text-green-600 font-medium">
                                    {formatPrice(item.unit_price)} cada
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => updateItemQuantity(item.product_code, 0)}
                                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateItemQuantity(item.product_code, item.quantity - 1)}
                                  className="bg-gray-200 hover:bg-gray-300 rounded-full p-1 transition-colors"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="font-medium w-8 text-center text-sm">{item.quantity}</span>
                                <button
                                  onClick={() => updateItemQuantity(item.product_code, item.quantity + 1)}
                                  className="bg-gray-200 hover:bg-gray-300 rounded-full p-1 transition-colors"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                              <div className="font-bold text-indigo-600 text-sm">
                                {formatPrice(item.subtotal)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cart Footer - Fixed */}
                  <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
                    {cartItems.length > 0 && (
                      <>
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-gray-800">Total:</span>
                            <span className="text-2xl font-bold text-indigo-600">
                              {formatPrice(getCartTotal())}
                            </span>
                          </div>
                          {paymentType === 'dinheiro' && changeAmount > 0 && (
                            <div className="flex justify-between text-sm text-gray-600 mt-2">
                              <span>Troco para {formatPrice(changeAmount)}:</span>
                              <span className="font-medium">
                                {formatPrice(Math.max(0, changeAmount - getCartTotal()))}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <button
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                          >
                            Finalizar Venda
                          </button>
                          <button
                            onClick={() => setCartItems([])}
                            className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
                          >
                            Limpar Carrinho
                          </button>
                        </div>
                      </>
                    )}

                    <button
                      onClick={closeSaleModal}
                      className="w-full mt-3 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSalesPanel;