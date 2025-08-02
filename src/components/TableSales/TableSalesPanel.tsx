import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Eye, 
  EyeOff, 
  Save, 
  X, 
  Clock,
  DollarSign,
  ShoppingCart,
  Calculator,
  User,
  Phone,
  CreditCard,
  Minus,
  Package,
  AlertCircle,
  CheckCircle,
  XCircle
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
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [cartItems, setCartItems] = useState<TableCartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    count: 1
  });
  const [paymentInfo, setPaymentInfo] = useState({
    type: 'dinheiro' as 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto',
    changeAmount: 0
  });
  const [newProduct, setNewProduct] = useState({
    code: '',
    name: '',
    quantity: 1,
    price: 0,
    notes: ''
  });

  const tableName = storeId === 1 ? 'store1_tables' : 'store2_tables';
  const salesTableName = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
  const itemsTableName = storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🔄 Carregando mesas da Loja ${storeId}...`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select(`
          *,
          current_sale:${salesTableName}(*)
        `)
        .order('number');

      if (error) throw error;

      console.log(`✅ ${data?.length || 0} mesas carregadas da Loja ${storeId}`);
      setTables(data || []);
    } catch (err) {
      console.error(`❌ Erro ao carregar mesas da Loja ${storeId}:`, err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar mesas');
    } finally {
      setLoading(false);
    }
  };

  const createTable = async (tableData: Omit<RestaurantTable, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log(`🚀 Criando mesa na Loja ${storeId}:`, tableData);

      const { data, error } = await supabase
        .from(tableName)
        .insert([tableData])
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Mesa criada na Loja ${storeId}:`, data);
      setTables(prev => [...prev, data].sort((a, b) => a.number - b.number));
      return data;
    } catch (err) {
      console.error(`❌ Erro ao criar mesa na Loja ${storeId}:`, err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar mesa');
    }
  };

  const updateTable = async (id: string, updates: Partial<RestaurantTable>) => {
    try {
      console.log(`✏️ Atualizando mesa da Loja ${storeId}:`, id, updates);

      const { data, error } = await supabase
        .from(tableName)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Mesa atualizada na Loja ${storeId}:`, data);
      setTables(prev => prev.map(t => t.id === id ? data : t));
      return data;
    } catch (err) {
      console.error(`❌ Erro ao atualizar mesa da Loja ${storeId}:`, err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar mesa');
    }
  };

  const deleteTable = async (id: string) => {
    try {
      console.log(`🗑️ Excluindo mesa da Loja ${storeId}:`, id);

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log(`✅ Mesa excluída da Loja ${storeId}`);
      setTables(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(`❌ Erro ao excluir mesa da Loja ${storeId}:`, err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir mesa');
    }
  };

  const openTableSale = async (table: RestaurantTable) => {
    try {
      console.log(`🍽️ Abrindo venda para mesa ${table.number} da Loja ${storeId}`);

      const { data, error } = await supabase
        .from(salesTableName)
        .insert([{
          table_id: table.id,
          operator_name: operatorName || 'Operador',
          customer_name: customerInfo.name || `Mesa ${table.number}`,
          customer_count: customerInfo.count,
          subtotal: 0,
          discount_amount: 0,
          total_amount: 0,
          status: 'aberta',
          opened_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar status da mesa
      await updateTable(table.id, {
        status: 'ocupada',
        current_sale_id: data.id
      });

      console.log(`✅ Venda aberta para mesa ${table.number}:`, data);
      setShowSaleModal(false);
      setCustomerInfo({ name: '', count: 1 });
    } catch (err) {
      console.error(`❌ Erro ao abrir venda da mesa:`, err);
      alert('Erro ao abrir venda da mesa');
    }
  };

  const addItemToSale = async (saleId: string, item: TableCartItem) => {
    try {
      console.log(`➕ Adicionando item à venda:`, item);

      const { data, error } = await supabase
        .from(itemsTableName)
        .insert([{
          sale_id: saleId,
          product_code: item.product_code,
          product_name: item.product_name,
          quantity: item.quantity,
          weight_kg: item.weight,
          unit_price: item.unit_price,
          price_per_gram: item.price_per_gram,
          discount_amount: 0,
          subtotal: item.subtotal,
          notes: item.notes
        }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar total da venda
      const { data: saleData, error: saleError } = await supabase
        .from(salesTableName)
        .select(`*, ${itemsTableName}(*)`)
        .eq('id', saleId)
        .single();

      if (saleError) throw saleError;

      const newSubtotal = saleData[itemsTableName]?.reduce((sum: number, item: any) => sum + item.subtotal, 0) || 0;

      await supabase
        .from(salesTableName)
        .update({
          subtotal: newSubtotal,
          total_amount: newSubtotal
        })
        .eq('id', saleId);

      console.log(`✅ Item adicionado à venda`);
      await fetchTables();
    } catch (err) {
      console.error(`❌ Erro ao adicionar item:`, err);
      throw err;
    }
  };

  const closeTableSale = async (table: RestaurantTable, paymentType: string, changeAmount?: number) => {
    try {
      if (!table.current_sale_id) return;

      console.log(`💰 Fechando venda da mesa ${table.number}`);

      await supabase
        .from(salesTableName)
        .update({
          payment_type: paymentType,
          change_amount: changeAmount || 0,
          status: 'fechada',
          closed_at: new Date().toISOString()
        })
        .eq('id', table.current_sale_id);

      // Atualizar status da mesa
      await updateTable(table.id, {
        status: 'aguardando_conta',
        current_sale_id: null
      });

      console.log(`✅ Venda da mesa ${table.number} fechada`);
    } catch (err) {
      console.error(`❌ Erro ao fechar venda:`, err);
      throw err;
    }
  };

  const filteredTables = searchTerm
    ? tables.filter(table => 
        table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.number.toString().includes(searchTerm)
      )
    : tables;

  const handleCreate = () => {
    setEditingTable({
      id: '',
      number: Math.max(...tables.map(t => t.number), 0) + 1,
      name: '',
      capacity: 4,
      status: 'livre',
      location: '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!editingTable) return;

    if (!editingTable.name.trim()) {
      alert('Nome da mesa é obrigatório');
      return;
    }

    // Verificar se número já existe
    const existingTable = tables.find(t => 
      t.number === editingTable.number && t.id !== editingTable.id
    );
    if (existingTable) {
      alert('Número da mesa já existe');
      return;
    }

    setSaving(true);
    
    try {
      if (isCreating) {
        const { id, created_at, updated_at, current_sale, ...tableData } = editingTable;
        await createTable(tableData);
      } else {
        await updateTable(editingTable.id, editingTable);
      }
      
      setEditingTable(null);
      setIsCreating(false);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Mesa ${isCreating ? 'criada' : 'atualizada'} com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (error) {
      console.error('Erro ao salvar mesa:', error);
      alert(`Erro ao salvar mesa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir a mesa "${name}"?`)) {
      try {
        await deleteTable(id);
      } catch (error) {
        console.error('Erro ao excluir mesa:', error);
        alert('Erro ao excluir mesa');
      }
    }
  };

  const handleToggleActive = async (table: RestaurantTable) => {
    try {
      await updateTable(table.id, { is_active: !table.is_active });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'livre': return 'bg-green-100 text-green-800';
      case 'ocupada': return 'bg-red-100 text-red-800';
      case 'aguardando_conta': return 'bg-yellow-100 text-yellow-800';
      case 'limpeza': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const addProductToCart = () => {
    if (!newProduct.name.trim() || !newProduct.code.trim() || newProduct.price <= 0) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const cartItem: TableCartItem = {
      product_code: newProduct.code,
      product_name: newProduct.name,
      quantity: newProduct.quantity,
      unit_price: newProduct.price,
      subtotal: newProduct.price * newProduct.quantity,
      notes: newProduct.notes
    };

    setCartItems(prev => [...prev, cartItem]);
    setNewProduct({
      code: '',
      name: '',
      quantity: 1,
      price: 0,
      notes: ''
    });
  };

  const removeFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.subtotal, 0);
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Users size={24} className="text-indigo-600" />
            Gerenciar Mesas - Loja {storeId}
          </h2>
          <p className="text-gray-600">Sistema de vendas para mesas do restaurante</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nova Mesa
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
            placeholder="Buscar mesas..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTables.map((table) => (
          <div
            key={table.id}
            className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all hover:shadow-md ${
              table.status === 'livre' ? 'border-green-200' :
              table.status === 'ocupada' ? 'border-red-200' :
              table.status === 'aguardando_conta' ? 'border-yellow-200' :
              'border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Mesa {table.number}</h3>
                <p className="text-sm text-gray-600">{table.name}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(table.status)}`}>
                {getStatusLabel(table.status)}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users size={16} />
                <span>Capacidade: {table.capacity} pessoas</span>
              </div>
              {table.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Package size={16} />
                  <span>Local: {table.location}</span>
                </div>
              )}
            </div>

            {/* Current Sale Info */}
            {table.current_sale && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart size={16} className="text-indigo-600" />
                  <span className="font-medium text-gray-800">Venda Ativa</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Cliente: {table.current_sale.customer_name}</p>
                  <p>Pessoas: {table.current_sale.customer_count}</p>
                  <p className="font-semibold text-green-600">
                    Total: {formatPrice(table.current_sale.total_amount)}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {table.status === 'livre' && (
                <button
                  onClick={() => {
                    setSelectedTable(table);
                    setShowSaleModal(true);
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  Abrir Mesa
                </button>
              )}
              
              {table.status === 'ocupada' && table.current_sale && (
                <button
                  onClick={() => {
                    setSelectedTable(table);
                    setShowSaleModal(true);
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  Gerenciar
                </button>
              )}

              <button
                onClick={() => setEditingTable(table)}
                className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                title="Editar mesa"
              >
                <Edit3 size={16} />
              </button>
              
              <button
                onClick={() => handleDelete(table.id, table.name)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                title="Excluir mesa"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTables.length === 0 && (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'Nenhuma mesa encontrada' : 'Nenhuma mesa cadastrada'}
          </p>
        </div>
      )}

      {/* Edit/Create Modal */}
      {editingTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {isCreating ? `Nova Mesa - Loja ${storeId}` : 'Editar Mesa'}
                </h2>
                <button
                  onClick={() => {
                    setEditingTable(null);
                    setIsCreating(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número da Mesa *
                </label>
                <input
                  type="number"
                  min="1"
                  value={editingTable.number}
                  onChange={(e) => setEditingTable({
                    ...editingTable,
                    number: parseInt(e.target.value) || 1
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Mesa *
                </label>
                <input
                  type="text"
                  value={editingTable.name}
                  onChange={(e) => setEditingTable({
                    ...editingTable,
                    name: e.target.value
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Mesa VIP, Mesa da Janela"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidade (pessoas)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={editingTable.capacity}
                  onChange={(e) => setEditingTable({
                    ...editingTable,
                    capacity: parseInt(e.target.value) || 4
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localização (opcional)
                </label>
                <input
                  type="text"
                  value={editingTable.location || ''}
                  onChange={(e) => setEditingTable({
                    ...editingTable,
                    location: e.target.value
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Área externa, Salão principal"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingTable.is_active}
                    onChange={(e) => setEditingTable({
                      ...editingTable,
                      is_active: e.target.checked
                    })}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Mesa ativa
                  </span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setEditingTable(null);
                  setIsCreating(false);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editingTable.name.trim()}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {isCreating ? 'Criar Mesa' : 'Salvar Alterações'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Modal */}
      {showSaleModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Mesa {selectedTable.number} - {selectedTable.name}
                </h2>
                <button
                  onClick={() => {
                    setShowSaleModal(false);
                    setSelectedTable(null);
                    setCartItems([]);
                    setCustomerInfo({ name: '', count: 1 });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                {/* Customer Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Informações do Cliente</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Cliente
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Nome do cliente"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Pessoas
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedTable.capacity}
                      value={customerInfo.count}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Add Product */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-gray-800">Adicionar Produto</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Código
                        </label>
                        <input
                          type="text"
                          value={newProduct.code}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, code: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Código"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Preço
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="0,00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Produto
                      </label>
                      <input
                        type="text"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Nome do produto"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantidade
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={newProduct.quantity}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Observações
                        </label>
                        <input
                          type="text"
                          value={newProduct.notes}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, notes: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Observações"
                        />
                      </div>
                    </div>

                    <button
                      onClick={addProductToCart}
                      className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg font-medium transition-colors"
                    >
                      Adicionar ao Pedido
                    </button>
                  </div>
                </div>

                {/* Cart */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Itens do Pedido</h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    {cartItems.length === 0 ? (
                      <div className="text-center py-8">
                        <ShoppingCart size={32} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500">Nenhum item adicionado</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cartItems.map((item, index) => (
                          <div key={index} className="bg-white rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-800">{item.product_name}</h4>
                                <p className="text-sm text-gray-600">Código: {item.product_code}</p>
                                <p className="text-sm text-gray-600">
                                  {item.quantity}x {formatPrice(item.unit_price || 0)}
                                </p>
                                {item.notes && (
                                  <p className="text-xs text-gray-500 italic">Obs: {item.notes}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-green-600">
                                  {formatPrice(item.subtotal)}
                                </span>
                                <button
                                  onClick={() => removeFromCart(index)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {cartItems.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-indigo-600">{formatPrice(getCartTotal())}</span>
                      </div>
                    </div>
                  )}

                  {/* Payment Info */}
                  {cartItems.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-800">Forma de Pagamento</h4>
                      
                      <select
                        value={paymentInfo.type}
                        onChange={(e) => setPaymentInfo(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="dinheiro">Dinheiro</option>
                        <option value="pix">PIX</option>
                        <option value="cartao_credito">Cartão de Crédito</option>
                        <option value="cartao_debito">Cartão de Débito</option>
                        <option value="voucher">Voucher</option>
                        <option value="misto">Pagamento Misto</option>
                      </select>

                      {paymentInfo.type === 'dinheiro' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Troco para:
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={paymentInfo.changeAmount}
                            onChange={(e) => setPaymentInfo(prev => ({ ...prev, changeAmount: parseFloat(e.target.value) || 0 }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Valor para troco"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setShowSaleModal(false);
                  setSelectedTable(null);
                  setCartItems([]);
                  setCustomerInfo({ name: '', count: 1 });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              
              {selectedTable.status === 'livre' && cartItems.length > 0 && (
                <button
                  onClick={() => openTableSale(selectedTable)}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  Abrir Mesa
                </button>
              )}
              
              {selectedTable.status === 'ocupada' && selectedTable.current_sale && (
                <button
                  onClick={() => closeTableSale(selectedTable, paymentInfo.type, paymentInfo.changeAmount)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <DollarSign size={16} />
                  Fechar Conta
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSalesPanel;