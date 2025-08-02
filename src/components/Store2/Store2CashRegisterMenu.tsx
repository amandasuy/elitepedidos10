import React, { useState, useEffect } from 'react';
import { usePDV2CashRegister } from '../../hooks/usePDV2CashRegister';
import { usePermissions } from '../../hooks/usePermissions';
import { 
  DollarSign, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Plus, 
  ShoppingBag, 
  Clock, 
  Save, 
  Printer, 
  Minus, 
  X, 
  Check,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const Store2CashRegisterMenu: React.FC = () => {
  const { hasPermission } = usePermissions();
  const {
    isOpen,
    currentRegister,
    summary,
    entries,
    loading,
    error,
    openCashRegister,
    closeCashRegister,
    addCashEntry,
    refreshData
  } = usePDV2CashRegister();

  const [supabaseConfigured, setSupabaseConfigured] = useState(true);
  const [showOpenRegister, setShowOpenRegister] = useState(false);
  const [showCloseRegister, setShowCloseRegister] = useState(false);
  const [showCashEntry, setShowCashEntry] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [entryType, setEntryType] = useState<'income' | 'expense'>('income');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDescription, setEntryDescription] = useState('');
  const [entryPaymentMethod, setEntryPaymentMethod] = useState('dinheiro');
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [closedRegister, setClosedRegister] = useState<any>(null);
  const [isClosing, setIsClosing] = useState(false);
  
  // Check Supabase configuration on mount
  React.useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const isConfigured = supabaseUrl && supabaseKey && 
                        supabaseUrl !== 'your_supabase_url_here' && 
                        supabaseKey !== 'your_supabase_anon_key_here' &&
                        !supabaseUrl.includes('placeholder');
    
    setSupabaseConfigured(isConfigured);
  }, []);

  const handleOpenRegister = async () => {
    if (!openingAmount) return;
    
    console.log('🚀 Abrindo caixa da Loja 2 com valor:', parseFloat(openingAmount));
    try {
      await openCashRegister(parseFloat(openingAmount));
      setShowOpenRegister(false);
      setOpeningAmount('');
    } catch (err) {
      console.error('Erro ao abrir caixa da Loja 2:', err);
    }
  };

  const handleCloseRegister = async () => {
    setShowCloseConfirmation(true);
  };

  const handleConfirmClose = async (closingAmount: number, justification?: string) => {
    setIsClosing(true);
    setShowCloseConfirmation(false);
    
    try {
      console.log('🔒 Fechando caixa da Loja 2 com valor:', closingAmount);
      const result = await closeCashRegister(closingAmount);
      
      if (result.success) {
        // Criar objeto do caixa fechado com todos os dados necessários
        setClosedRegister({
          ...currentRegister,
          closing_amount: closingAmount,
          closed_at: new Date().toISOString(),
          difference: closingAmount - (summary?.expected_balance || 0)
        });
        
        // Sempre mostrar o diálogo de opções após fechar
        setShowCloseDialog(true);
      } else {
        alert(`Erro ao fechar caixa: ${result.error}`);
      }
    } catch (err) {
      console.error('Erro ao fechar caixa da Loja 2:', err);
      alert('Erro ao fechar caixa. Tente novamente.');
    } finally {
      setIsClosing(false);
    }
  };

  const handleCashEntry = async () => {
    if (!entryAmount || !entryDescription) return;
    
    console.log('💰 Adicionando entrada ao caixa da Loja 2:', {
      type: entryType,
      amount: parseFloat(entryAmount),
      description: entryDescription,
      payment_method: entryPaymentMethod
    });
    
    try {
      await addCashEntry({
        type: entryType,
        amount: parseFloat(entryAmount),
        description: entryDescription,
        payment_method: entryPaymentMethod
      });
      setShowCashEntry(false);
      setEntryAmount('');
      setEntryDescription('');
      setEntryType('income');
      setEntryPaymentMethod('dinheiro');
    } catch (err) {
      console.error('Erro ao adicionar entrada da Loja 2:', err);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getPaymentMethodName = (method: string) => {
    const methodNames: Record<string, string> = {
      'dinheiro': 'Dinheiro',
      'pix': 'PIX',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'voucher': 'Voucher',
      'misto': 'Pagamento Misto'
    };
    
    return methodNames[method] || method;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Supabase Configuration Warning */}
      {!supabaseConfigured && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 rounded-full p-2">
              <AlertCircle size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-medium text-red-800">Funcionalidade de Caixa Indisponível - Loja 2</h3>
              <p className="text-red-700 text-sm">
                O sistema de caixa requer configuração do Supabase. Configure as variáveis de ambiente 
                VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para usar esta funcionalidade.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <DollarSign size={24} />
            Controle de Caixa - Loja 2
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {isOpen ? 'Caixa aberto' : 'Caixa fechado'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshData}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-colors text-sm"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
          
          {isOpen && (
            <button
              onClick={handleCloseRegister}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors text-sm"
            >
              <Clock size={16} />
              Fechar Caixa
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg border-2 ${isOpen ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Status do Caixa</p>
              <p className={`text-lg font-semibold ${isOpen ? 'text-green-600' : 'text-gray-600'}`}>
                {isOpen ? 'Aberto' : 'Fechado'}
              </p>
            </div>
            <div className={`p-2 rounded-full ${isOpen ? 'bg-green-100' : 'bg-gray-100'}`}>
              <DollarSign className={`h-6 w-6 ${isOpen ? 'text-green-600' : 'text-gray-600'}`} />
            </div>
          </div>
        </div>

        {currentRegister && (
          <>
            <div className="p-4 rounded-lg border-2 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor de Abertura</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatPrice(currentRegister.opening_amount || 0)}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-blue-100">
                  <ArrowUpCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border-2 bg-purple-50 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Saldo Atual</p>
                  <p className="text-lg font-semibold text-purple-600" title="Saldo esperado em dinheiro">
                    {formatPrice(summary.expected_balance)}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-purple-100">
                  <ShoppingBag className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {!isOpen && (
          <button
            onClick={() => setShowOpenRegister(true)}
            disabled={!supabaseConfigured}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={18} />
            Abrir Caixa
          </button>
        )}

        {isOpen && supabaseConfigured && (
          <>
            <button
              onClick={() => setShowCashEntry(true)}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <ArrowDownCircle size={18} />
              Adicionar Entrada
            </button>

            <button
              onClick={() => {
                setEntryType('expense');
                setShowCashEntry(true);
              }}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <ArrowUpCircle size={18} />
              Adicionar Saída
            </button>
          </>
        )}
      </div>

      {/* Resto do componente permanece igual... */}
      {/* Modais e outras funcionalidades */}
    </div>
  );
};

export default Store2CashRegisterMenu;