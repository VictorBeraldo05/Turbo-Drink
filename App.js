import React, { useMemo, useState } from 'react';
import { GoogleLoginButton } from "react-social-login-buttons";
import { useEffect } from 'react';
import { supabase } from './supabase';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  Image,
  ScrollView,
  Pressable,
  FlatList,
  Modal,
  Alert,
  Linking
} from 'react-native';

// Como não estamos mais no Snack, vamos usar uma imagem local
// Coloque sua imagem na pasta assets e ajuste o caminho conforme necessário

// ---- Palette ----
const COLORS = {
  bg: '#0c0c0e',
  card: '#141416',
  text: '#f5f5f6',
  muted: '#a1a1aa',
  brand: '#f97316', // orange
  brand700: '#ea580c',
  line: 'rgba(255,255,255,0.08)',
};

// ---- Helpers ----
function currency(n) {
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

// ---- Simple Router (no deps) ----
const SCREENS = {
  LOGIN: 'LOGIN',
  HOME: 'HOME',
  ORDERS: 'ORDERS',
  PROFILE: 'PROFILE',
  TRACK: 'TRACK',
  SIGNUP: 'SIGNUP',
};

function BrandMark({ size = 40 }) {
  return (
    <Image
      source={require("./assets/TurboDrink.png")}
      style={{ width: size, height: size, resizeMode: 'cover', borderRadius: 40}}
    />
  );
}

function AlertPopup({ visible, message, onClose, type = 'info' }) {
  // Ajuste de cores baseado no tipo de alerta
  const backgroundColors = {
    info: COLORS.bgLight || '#333',      // alerta informativo
    success: COLORS.success || '#4CAF50', // sucesso
    error: COLORS.error || '#F44336'     // erro
  };

  const textColors = {
    info: COLORS.text || '#FFF',
    success: '#FFF',
    error: '#FFF'
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={{
        flex:1,
        backgroundColor:'rgba(0,0,0,0.5)',
        justifyContent:'center',
        alignItems:'center'
      }}>
        <View style={{
          width: 300,
          backgroundColor: backgroundColors[type],
          borderRadius: 15,
          padding: 25,
          alignItems: 'center',
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5
        }}>
          <Text style={{ fontSize:16, marginBottom:20, textAlign:'center', color: textColors[type] }}>
            {message}
          </Text>
          <Pressable 
            onPress={onClose} 
            style={{ paddingVertical:10, paddingHorizontal:20, borderRadius:10, backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            <Text style={{ color: textColors[type], fontWeight:'bold' }}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function App() {
  const [screen, setScreen] = useState(SCREENS.LOGIN);
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('');
  const [cart, setCart] = useState([]); // {id, qty}
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orders, setOrders] = useState([]); // {id, items, total, status, createdAt}
  const [activeOrder, setActiveOrder] = useState(null);
  const [address, setAddress] = useState('Av. Paulista, 1000');
  const [payment, setPayment] = useState('Pix');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  async function fetchCategories() {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) {
      console.error('Erro ao buscar categorias:', error);
    } else {
      console.log('Categorias do banco:', data); // 👈 veja no console
      setCategories(data);
    }
  }

  async function fetchProducts() {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.error('Erro ao buscar produtos:', error);
    } else {
      setProducts(data);
    }
  }

  // Derived

  const cartDetailed = cart.map((ci) => ({
    ...products.find((p) => p.id === ci.id),
    qty: ci.qty,
  }));
  const subtotal = cartDetailed.reduce((s, it) => s + it.price * it.qty, 0);
  const delivery = cartDetailed.length ? 8.9 : 0;
  const total = subtotal + delivery;

  function addToCart(p) {
    setCart((prev) => {
      const f = prev.find((x) => x.id === p.id);
      if (f)
        return prev.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x));
      return [...prev, { id: p.id, qty: 1 }];
    });
    setCartOpen(true);
  }
  function changeQty(id, delta) {
    setCart((prev) =>
      prev
        .map((x) => (x.id === id ? { ...x, qty: x.qty + delta } : x))
        .filter((x) => x.qty > 0)
    );
  }

  function handleLogin(email) {
    setUser({
      name: email || 'Cliente Turbo',
      email: email || 'cliente@turbodrink.app',
    });
    setScreen(SCREENS.HOME);
  }

  function placeOrder() {
    if (!cartDetailed.length) {
      Alert.alert('Carrinho vazio');
      return;
    }
    const id = Math.floor(Math.random() * 900000 + 100000);
    const order = {
      id,
      items: cartDetailed,
      subtotal,
      delivery,
      total,
      address,
      payment,
      status: 'recebido',
      createdAt: new Date().toISOString(),
    };
    setOrders([order, ...orders]);
    setActiveOrder(order);
    setCart([]);
    setCartOpen(false);
    setCheckoutOpen(false);
    setScreen(SCREENS.TRACK);
    // Simulate status updates
    setTimeout(
      () => setActiveOrder((o) => (o ? { ...o, status: 'preparando' } : o)),
      2500
    );
    setTimeout(
      () => setActiveOrder((o) => (o ? { ...o, status: 'a caminho' } : o)),
      6000
    );
    setTimeout(
      () => setActiveOrder((o) => (o ? { ...o, status: 'entregue' } : o)),
      10000
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="light-content" />
      {!user && screen === SCREENS.LOGIN && (
        <LoginScreen onLoginSuccess={handleLogin} 
        onSignupNavigate={() => setScreen(SCREENS.SIGNUP)}/>
      )}
    {!user && screen === SCREENS.SIGNUP && (
      <SignupScreen
        onSignup={(dados) => {
          // aqui você poderia salvar num backend
          setUser({ name: dados.nome, email: dados.email });
          setScreen(SCREENS.HOME);
        }}
        onBack={() => setScreen(SCREENS.LOGIN)}
      />
    )}
      {user && (
        <>
          <Header
            onOpenCart={() => setCartOpen(true)}
            cartCount={cart.reduce((s, x) => s + x.qty, 0)}
          />
          {screen === SCREENS.HOME && (
            <HomeScreen
              query={query}
              onQuery={setQuery}
              categories={categories}
              cat={cat}
              onCat={setCat}
              products={products}
              onAdd={addToCart}
            />
          )}
          {screen === SCREENS.ORDERS && (
            <OrdersScreen
              orders={orders}
              onOpen={(ord) => {
                setActiveOrder(ord);
                setScreen(SCREENS.TRACK);
              }}
            />
          )}
          {screen === SCREENS.PROFILE && (
            <ProfileScreen
              user={user}
              address={address}
              setAddress={setAddress}
              payment={payment}
              setPayment={setPayment}
            />
          )}
          {screen === SCREENS.TRACK && activeOrder && (
            <TrackScreen
              order={activeOrder}
              onBackHome={() => setScreen(SCREENS.HOME)}
            />
          )}

          <TabBar current={screen} onChange={setScreen} />

          <CartModal
            open={cartOpen}
            items={cartDetailed}
            subtotal={subtotal}
            delivery={delivery}
            total={total}
            onClose={() => setCartOpen(false)}
            onMinus={(id) => changeQty(id, -1)}
            onPlus={(id) => changeQty(id, +1)}
            onCheckout={() => setCheckoutOpen(true)}
          />

          <CheckoutModal
            open={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            address={address}
            setAddress={setAddress}
            payment={payment}
            setPayment={setPayment}
            total={total}
            onConfirm={placeOrder}
          />
        </>
      )}
    </SafeAreaView>
  );
}

// ---- UI Blocks ----
function Header({ onOpenCart, cartCount }) {
  return (
    <View style={styles.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <BrandMark size={38} />
        <View>
          <Text style={styles.brand}>Turbo Drink</Text>
          <Text style={styles.subtitle}>Adega & Entregas Rápidas</Text>
        </View>
      </View>
      <Pressable onPress={onOpenCart} style={styles.cartBtn}>
        <Text style={{ color: '#000', fontWeight: '700' }}>Carrinho</Text>
        {cartCount > 0 && (
          <View style={styles.badge}>
            <Text style={{ fontSize: 12, fontWeight: '700' }}>{cartCount}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

function TabBar({ current, onChange }) {
  const items = [
    { key: SCREENS.HOME, label: 'Início' },
    { key: SCREENS.ORDERS, label: 'Pedidos' },
    { key: SCREENS.PROFILE, label: 'Perfil' },
  ];
  return (
    <View style={styles.tabbar}>
      {items.map((it) => (
        <Pressable
          key={it.key}
          style={styles.tabItem}
          onPress={() => onChange(it.key)}>
          <Text
            style={[
              styles.tabTxt,
              current === it.key && { color: COLORS.brand },
            ]}>
            {' '}
            {it.label}{' '}
          </Text>
          {current === it.key && <View style={styles.tabIndicator} />}
        </Pressable>
      ))}
    </View>
  );
}

function LoginScreen({ onSignupNavigate, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAdditionalForm, setShowAdditionalForm] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);

  // --- Deep Link listener ---
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const user = session.user;
  
        // Verifica se o usuário existe na tabela
        const { data: usuarioData } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', user.id)
          .single();
  
        if (!usuarioData) {
          setGoogleUser(user);
          setShowAdditionalForm(true);
        } else {
          onLoginSuccess(user);
        }
      }
    });
  
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogin() {
    if (!email || !senha) {
      setAlertMessage("Preencha todos os campos");
      setAlertVisible(true);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      setAlertMessage(error.message);
      setAlertVisible(true);
      return;
    }

    // login normal
    onLoginSuccess(data.user);
  }

  async function handleGoogleLogin() {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'turbodrink://callback', // deep link do seu app
        }
      });
      // O redirecionamento para o app vai disparar o listener acima
    } catch (err) {
      setAlertMessage("Erro ao iniciar login com Google");
      setAlertVisible(true);
    }
  }

  if (showAdditionalForm && googleUser) {
    return <AdditionalInfoForm user={googleUser} onComplete={() => onLoginSuccess(googleUser)} />;
  }

  return (
    <View style={{ backgroundColor: COLORS.bg, flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 20 }}>
      <BrandMark size={300} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="Senha" value={senha} onChangeText={setSenha} secureTextEntry style={styles.input} />

      <Pressable onPress={handleLogin} style={styles.primaryBtn}>
        <Text style={styles.primaryTxt}>Entrar</Text>
      </Pressable>

      <Pressable
        onPress={handleGoogleLogin}
        style={styles.btnGoogleLogin}
      >
        <Image
          source={require('./assets/google.png')}
          style={{ width: 20, height: 20, marginRight: 20, }}
        />
        <Text style={{fontSize: 15, color: "#000", fontWeight: "500",}}>Entrar com Google</Text>
      </Pressable>

      <AlertPopup visible={alertVisible} message={alertMessage} onClose={() => setAlertVisible(false)} />
    </View>
  );
}

// ---- AdditionalInfoForm ----
function AdditionalInfoForm({ user, onComplete }) {
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  async function handleSubmit() {
    if (!cpf || !telefone) {
      setAlertMessage("Preencha todos os campos");
      setAlertVisible(true);
      return;
    }

  const { data: existing, error: checkError } = await supabase
    .from('usuarios')
    .select('id')
    .eq('cpf', cpf)
    .single();

    if (existing) {
      setAlertMessage("CPF já cadastrado. Verifique seus dados.");
      setAlertVisible(true);
      return;
    }
  
    const { data, error } = await supabase
      .from('usuarios')
      .insert([
        { 
          id: user.id, 
          nome: user.user_metadata?.full_name || user.email,
          cpf, 
          telefone
        }
      ]);
  
    if (error) {
      console.error('Erro ao salvar dados adicionais:', error); // 👈 log completo
      setAlertMessage("Erro ao salvar dados. Veja o console para detalhes.");
      setAlertVisible(true);
    } else {
      onComplete();
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{color: 'white', fontSize: 25, textAlign: 'center'}}>Preencha as informações</Text>
      <Text style={{color: 'white', fontSize: 25, textAlign: 'center', marginTop: 20, marginBottom: 65}}>Para completar seu cadastro</Text>
      <TextInput placeholder="CPF" value={cpf} onChangeText={setCpf} style={styles.input} />
      <TextInput placeholder="Telefone" value={telefone} onChangeText={setTelefone} style={styles.input} />
      <Pressable onPress={handleSubmit} style={styles.primaryBtn}>
        <Text style={styles.primaryTxt}>Continuar</Text>
      </Pressable>

      <AlertPopup visible={alertVisible} message={alertMessage} onClose={() => setAlertVisible(false)} />
    </View>
  );
}

function SignupScreen({ onBack }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  async function handleSignup() {
    if (!nome || !email || !cpf || !telefone || !senha) {
      setAlertMessage("Por favor, preencha todos os campos para criar sua conta.");
      setAlertVisible(true);
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password: senha });

    if (error) {
      if (error.message.includes('User already registered')) {
        setAlertMessage("Este e-mail já está cadastrado. Tente fazer login.");
      } else {
        setAlertMessage("Erro ao criar conta. Tente novamente mais tarde.");
      }
      setAlertVisible(true);
      return;
    }

    const user = data.user;

    const { error: insertError } = await supabase.from('usuarios').insert([
      { id: user.id, nome, cpf, telefone }
    ]);

    if (insertError) {
      setAlertMessage("Erro ao salvar dados adicionais. Tente novamente mais tarde.");
      setAlertVisible(true);
    } else {
      setAlertMessage("Conta criada com sucesso! Faça login para continuar.");
      setAlertVisible(true);
      // volta para login após 1.5s
      setTimeout(() => onBack(), 1500);
    }
  }

  return (
    <View style={{ flex:1, backgroundColor: COLORS.bg, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 26, color: COLORS.text, marginBottom: 20, textAlign: 'center' }}>Criar conta</Text>

      <TextInput placeholder="Nome completo" value={nome} onChangeText={setNome} style={styles.input} />
      <TextInput placeholder="E-mail" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="CPF" value={cpf} onChangeText={setCpf} style={styles.input} />
      <TextInput placeholder="Telefone" value={telefone} onChangeText={setTelefone} style={styles.input} />
      <TextInput placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha} style={styles.input} />

      <Pressable onPress={handleSignup} style={[styles.primaryBtn, { marginTop: 20 }]}>
        <Text style={styles.primaryTxt}>Cadastrar</Text>
      </Pressable>

      <Pressable onPress={onBack} style={{ marginTop: 15 }}>
        <Text style={{ fontSize: 15, color: COLORS.muted, textAlign: 'center' }}>Já tem conta? Voltar para login</Text>
      </Pressable>

      <AlertPopup visible={alertVisible} message={alertMessage} onClose={() => setAlertVisible(false)} />
    </View>
  );
}

function HomeScreen({ query, onQuery, categories, cat, onCat, products, onAdd }) {
  // Filtra produtos por categoria e busca
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = !cat || String(p.cat) === String(cat); // 'cat' da tabela products
      const matchesQuery = !query || p.name.toLowerCase().includes(query.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [products, cat, query]);

  return (
    <FlatList
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 100 }}
      data={filteredProducts}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <>
          <View style={styles.banner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Bem-vindo à Turbo Drink</Text>
              <Text style={styles.bannerSub}>Entrega rápida para matar sua sede</Text>
            </View>
            <BrandMark size={72} />
          </View>

          <TextInput
            value={query}
            onChangeText={onQuery}
            placeholder="Buscar itens (ex: Heineken, Vodka...)"
            placeholderTextColor={COLORS.muted}
            style={styles.search}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 8 }}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            <Chip label={'Tudo'} active={!cat} onPress={() => onCat(null)} />
            {categories.map((c) => (
              <Chip key={c.id} label={c.name} active={String(cat) === String(c.id)} onPress={() => onCat(c.id)} />
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Itens populares</Text>
        </>
      }
      renderItem={({ item }) => <ProductCard item={item} onAdd={() => onAdd(item)} />}
      ListEmptyComponent={
        <Text style={{ color: COLORS.muted, padding: 16 }}>Nenhum item encontrado.</Text>
      } 
    />
  );
}

function Chip({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: COLORS.brand }]}>
      <Text
        style={[
          styles.chipTxt,
          active && { color: '#000', fontWeight: '800' },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ProductCard({ item, onAdd }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: item.img }} style={styles.cardImg} />
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardPrice}>{currency(item.price)}</Text>
      </View>
      <Pressable onPress={onAdd} style={styles.addBtn}>
        <Text style={{ fontWeight: '800' }}>Adicionar</Text>
      </Pressable>
    </View>
  );
}

function CartModal({
  open,
  onClose,
  items,
  subtotal,
  delivery,
  total,
  onMinus,
  onPlus,
  onCheckout,
}) {
  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Seu carrinho</Text>
          <Pressable onPress={onClose}>
            <Text style={{ color: COLORS.muted }}>Fechar</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {items.length === 0 && (
            <Text style={{ color: COLORS.muted }}>
              Seu carrinho está vazio.
            </Text>
          )}
          {items.map((it) => (
            <View key={it.id} style={styles.cartItem}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.text, fontWeight: '600' }}>
                  {it.name}
                </Text>
                <Text style={{ color: COLORS.muted, marginTop: 2 }}>
                  {currency(it.price)} • {it.qty} un
                </Text>
              </View>
              <View style={styles.qtyRow}>
                <Pressable onPress={() => onMinus(it.id)} style={styles.qtyBtn}>
                  <Text>-</Text>
                </Pressable>
                <Text
                  style={{
                    color: COLORS.text,
                    minWidth: 24,
                    textAlign: 'center',
                  }}>
                  {it.qty}
                </Text>
                <Pressable onPress={() => onPlus(it.id)} style={styles.qtyBtn}>
                  <Text>+</Text>
                </Pressable>
              </View>
            </View>
          ))}

          <View style={styles.divider} />
          <Row label="Subtotal" value={currency(subtotal)} />
          <Row label="Entrega" value={currency(delivery)} />
          <Row
            label={<Text style={{ fontWeight: '800' }}>Total</Text>}
            value={<Text style={{ fontWeight: '800' }}>{currency(total)}</Text>}
          />
        </ScrollView>
        <View style={{ padding: 16 }}>
          <Pressable
            disabled={!items.length}
            onPress={onCheckout}
            style={[styles.primaryBtn, !items.length && { opacity: 0.5 }]}>
            <Text style={styles.primaryTxt}>Ir para pagamento</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function CheckoutModal({
  open,
  onClose,
  address,
  setAddress,
  payment,
  setPayment,
  total,
  onConfirm,
}) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.modalTitle}>Pagamento</Text>
          <Text style={{ color: COLORS.muted, marginBottom: 12 }}>
            Confirme os dados e finalize
          </Text>

          <Text style={styles.label}>Endereço</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Seu endereço"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
          />

          <Text style={styles.label}>Forma de pagamento</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {['Pix', 'Cartão', 'Dinheiro'].map((p) => (
              <Pressable
                key={p}
                onPress={() => setPayment(p)}
                style={[
                  styles.payBtn,
                  payment === p && { backgroundColor: COLORS.brand },
                ]}>
                <Text
                  style={[
                    styles.payTxt,
                    payment === p && { color: '#000', fontWeight: '800' },
                  ]}>
                  {p}
                </Text>
              </Pressable>
            ))}
          </View>

          <Row
            label={<Text style={{ fontWeight: '800' }}>Total</Text>}
            value={<Text style={{ fontWeight: '800' }}>{currency(total)}</Text>}
          />

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            <Pressable onPress={onClose} style={styles.secondaryBtn}>
              <Text style={styles.secondaryTxt}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[styles.primaryBtn, { flex: 1 }]}>
              <Text style={styles.primaryTxt}>Finalizar pedido</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function OrdersScreen({ orders, onOpen }) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={styles.sectionTitle}>Seus pedidos</Text>
      {orders.length === 0 && (
        <Text style={{ color: COLORS.muted, paddingHorizontal: 16 }}>
          Você ainda não fez pedidos.
        </Text>
      )}
      {orders.map((o) => (
        <Pressable
          key={o.id}
          onPress={() => onOpen(o)}
          style={styles.orderCard}>
          <Text style={{ color: COLORS.text, fontWeight: '700' }}>
            #{o.id} • {o.status}
          </Text>
          <Text style={{ color: COLORS.muted, marginTop: 4 }}>
            {new Date(o.createdAt).toLocaleString()}
          </Text>
          <Text style={{ color: COLORS.text, marginTop: 6 }}>
            {o.items.length} itens • {currency(o.total)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function TrackScreen({ order, onBackHome }) {
  const steps = ['recebido', 'preparando', 'a caminho', 'entregue'];
  const current = steps.indexOf(order.status);
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.sectionTitle}>Acompanhar pedido</Text>
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={{ color: COLORS.muted }}>Pedido #{order.id}</Text>
        <View style={{ marginTop: 12, gap: 10 }}>
          {steps.map((s, i) => (
            <View
              key={s}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={[
                  styles.dot,
                  i <= current
                    ? { backgroundColor: COLORS.brand }
                    : { backgroundColor: 'rgba(255,255,255,0.2)' },
                ]}
              />
              <Text
                style={{ color: i <= current ? COLORS.text : COLORS.muted }}>
                {s.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
        <Pressable
          onPress={onBackHome}
          style={[
            styles.primaryBtn,
            { marginTop: 24, alignSelf: 'flex-start' },
          ]}>
          <Text style={styles.primaryTxt}>Voltar ao início</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ProfileScreen({ user, address, setAddress, payment, setPayment }) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={styles.sectionTitle}>Seu perfil</Text>
      <View style={styles.formCard}>
        <Text style={styles.label}>Nome</Text>
        <TextInput
          value={user.name}
          editable={false}
          style={[styles.input, { opacity: 0.7 }]}
        />
        <Text style={styles.label}>E-mail</Text>
        <TextInput
          value={user.email}
          editable={false}
          style={[styles.input, { opacity: 0.7 }]}
        />

        <Text style={styles.label}>Endereço padrão</Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="Endereço"
          placeholderTextColor={COLORS.muted}
          style={styles.input}
        />

        <Text style={styles.label}>Pagamento preferido</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['Pix', 'Cartão', 'Dinheiro'].map((p) => (
            <Pressable
              key={p}
              onPress={() => setPayment(p)}
              style={[
                styles.payBtn,
                payment === p && { backgroundColor: COLORS.brand },
              ]}>
              <Text
                style={[
                  styles.payTxt,
                  payment === p && { color: '#000', fontWeight: '800' },
                ]}>
                {p}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      {typeof label === 'string' ? (
        <Text style={{ color: COLORS.muted }}>{label}</Text>
      ) : (
        label
      )}
      {typeof value === 'string' ? (
        <Text style={{ color: COLORS.text }}>{value}</Text>
      ) : (
        value
      )}
    </View>
  );
}

// ---- Styles ----
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomColor: COLORS.line,
    borderBottomWidth: 1,
  },
  logo: { width: 38, height: 38, marginRight: 10, tintColor: '#fff' },
  brand: {
    color: COLORS.text,
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 0.3,
  },
  subtitle: { color: COLORS.muted, fontSize: 12 },
  cartBtn: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ffd54a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },

  tabbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderTopColor: COLORS.line,
    borderTopWidth: 1,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabTxt: { color: COLORS.muted, fontWeight: '700' },
  tabIndicator: {
    width: 28,
    height: 3,
    backgroundColor: COLORS.brand,
    borderRadius: 2,
    marginTop: 6,
  },

  input: {
    backgroundColor: '#0b0b0d',
    borderRadius: 14,
    width: 350,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 20,
    color: COLORS.text,
    borderWidth: 5,
    borderColor: COLORS.line,
    marginTop: 15, marginBottom: 15,
  },

  inputSenha: {
    backgroundColor: '#0b0b0d',
    borderRadius: 14,
    width: 350,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 20,
    color: COLORS.text,
    borderWidth: 5,
    borderColor: COLORS.line,
    marginBottom: 30,
  },

  banner: {
    margin: 16,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  bannerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  bannerSub: { color: COLORS.muted, marginTop: 4 },
  bannerLogo: { width: 72, height: 72, tintColor: '#fff' },

  search: {
    marginHorizontal: 16,
    backgroundColor: '#0b0b0d',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  sectionTitle: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 16,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#1a1a1d',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  chipTxt: { color: COLORS.text, fontWeight: '700' },

  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 10,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  cardImg: { width: 72, height: 72, borderRadius: 14, backgroundColor: '#000' },
  cardTitle: { color: COLORS.text, fontWeight: '700' },
  cardPrice: { color: '#ffd79a', marginTop: 4, fontWeight: '800' },
  addBtn: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    backgroundColor: COLORS.card,
  },
  modalTitle: { color: COLORS.text, fontWeight: '800', fontSize: 16 },
  cartItem: {
    backgroundColor: '#0f0f12',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  payBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#1a1a1d',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  payTxt: { color: COLORS.text, fontWeight: '700' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },

  orderCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  dot: { width: 12, height: 12, borderRadius: 6 },

  formCard: {
    margin: 16,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    gap: 8,
  },

  primaryBtn: {
    backgroundColor: COLORS.brand,
    width: 350,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  btn_Logins: {
    width: 350,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textWhite: { 
    color: '#white', 
    fontWeight: '800'
   },

  primaryTxt: { color: '#000', fontWeight: '900', fontSize: 20},
  secondaryBtn: {
    backgroundColor: '#1a1a1d',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  btnGoogleLogin: {
    width: 350,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    marginTop: 20,
    shadowRadius: 2,
    elevation: 2,
  },

  secondaryTxt: { color: COLORS.text, fontWeight: '800' },
  divider: { height: 1, backgroundColor: COLORS.line, marginVertical: 8 },
});
