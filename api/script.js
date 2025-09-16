// api/script.js

// Tenta carregar as variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Verifica se as variáveis de ambiente estão disponíveis
if (!supabaseUrl || !supabaseKey) {
    console.error("Variáveis de ambiente do Supabase não configuradas!");
    
    // Mostra uma mensagem amigável para o usuário
    document.addEventListener('DOMContentLoaded', function() {
        const productsContainer = document.getElementById('products-container');
        if (productsContainer) {
            productsContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <h2>Configuração necessária</h2>
                    <p>Para exibir os produtos, é necessário configurar as credenciais do Supabase.</p>
                    <p>Por favor, <a href="/config.html">clique aqui</a> para configurar.</p>
                </div>
            `;
        }
        
        // Desabilita o formulário de cadastro se estiver na página
        const productForm = document.getElementById('form-produto');
        if (productForm) {
            productForm.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <h2>Configuração necessária</h2>
                    <p>Para cadastrar produtos, é necessário configurar as credenciais do Supabase.</p>
                    <p>Por favor, <a href="/config.html">clique aqui</a> para configurar.</p>
                </div>
            `;
        }
    });
    
    // Encerra a execução do script
    throw new Error("Variáveis de ambiente do Supabase não configuradas!");
}

// Importa e configura o Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const supabase = createClient(supabaseUrl, supabaseKey);

// Restante do seu código...
// [INSIRA AQUI O RESTO DO SEU CÓDIGO ORIGINAL]
// Função para carregar produtos da vitrine
async function carregarProdutos() {
    try {
        console.log("Carregando produtos do Supabase...");
        
        const { data: produtos, error } = await supabase
            .from('produtos')
            .select('*');

        if (error) {
            console.error('Erro ao buscar produtos:', error.message);
            return;
        }

        const productsContainer = document.getElementById('products-container');
        
        if (!productsContainer) {
            console.log("Elemento products-container não encontrado (provavelmente não está na página de vitrine)");
            return;
        }
        
        productsContainer.innerHTML = '';

        if (produtos.length === 0) {
            productsContainer.innerHTML = '<p class="no-products">Nenhum produto cadastrado ainda.</p>';
            return;
        }

        produtos.forEach(produto => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';

            productCard.innerHTML = `
                <img src="${produto.imagem_url}" alt="${produto.nome}" class="product-img" onerror="this.src='https://via.placeholder.com/300x200?text=Imagem+Não+Disponível'">
                <div class="product-info">
                    <h3 class="product-title">${produto.nome}</h3>
                    <p class="product-description">${produto.descricao}</p>
                    <p class="product-store">Loja: ${produto.loja}</p>
                    <span class="product-price">R$ ${parseFloat(produto.preco).toFixed(2)}</span>
                    <a href="${produto.link}" class="product-link-btn" target="_blank">Ver Oferta</a>
                </div>
            `;

            productsContainer.appendChild(productCard);
        });
    } catch (error) {
        console.error('Erro inesperado:', error);
    }
}

// Função para cadastrar produto
async function cadastrarProduto(nome, categoria, descricao, preco, loja, link, arquivoImagem) {
    try {
        // Upload da imagem
        const nomeArquivoUnico = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}_${arquivoImagem.name}`;
        
        const { error: uploadError } = await supabase.storage
            .from('imagens_produtos')
            .upload(nomeArquivoUnico, arquivoImagem);

        if (uploadError) {
            console.error('Erro no upload da imagem:', uploadError.message);
            throw new Error('Falha no upload da imagem.');
        }

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('imagens_produtos')
            .getPublicUrl(nomeArquivoUnico);
        
        // Inserir dados do produto
        const { error: insertError } = await supabase
            .from('produtos')
            .insert([
                {
                    nome: nome,
                    categoria: categoria,
                    descricao: descricao,
                    preco: preco,
                    loja: loja,
                    link: link,
                    imagem_url: publicUrl,
                },
            ]);

        if (insertError) {
            console.error('Erro ao inserir dados do produto:', insertError.message);
            // Tentar remover a imagem enviada em caso de erro
            await supabase.storage.from('imagens_produtos').remove([nomeArquivoUnico]);
            throw new Error('Falha ao cadastrar o produto no banco de dados.');
        }

        console.log('Produto cadastrado com sucesso!');
        return { success: true };

    } catch (error) {
        console.error('Erro geral no cadastro:', error.message);
        return { success: false, error: error.message };
    }
}

// Inicialização com verificação de página
document.addEventListener('DOMContentLoaded', function() {
    // Verifica se estamos na página de vitrine (index.html)
    if (document.getElementById('products-container')) {
        carregarProdutos();
        
        // Configurar filtros e busca (se existirem na página)
        const filterButtons = document.querySelectorAll('.filter-btn');
        const searchInput = document.querySelector('.search-bar input');
        const searchButton = document.querySelector('.search-bar button');
        
        if (filterButtons.length > 0) {
            filterButtons.forEach(button => {
                button.addEventListener('click', function() {
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                    // Aqui você implementaria a lógica de filtro
                    carregarProdutos(); // Recarregar com filtros (implementar filtragem)
                });
            });
        }
        
        if (searchButton && searchInput) {
            searchButton.addEventListener('click', function() {
                // Implementar busca
                carregarProdutos(); // Recarregar com termo de busca
            });
            
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    carregarProdutos(); // Recarregar com termo de busca
                }
            });
        }
    }
    
    // Verifica se estamos na página de cadastro
    const formProduto = document.getElementById('form-produto');
    if (formProduto) {
        formProduto.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nome = document.getElementById('nome').value;
            const categoria = document.getElementById('categoria').value;
            const descricao = document.getElementById('descricao').value;
            const preco = parseFloat(document.getElementById('preco').value);
            const loja = document.getElementById('loja').value;
            const link = document.getElementById('link').value;
            const arquivoImagem = document.getElementById('imagem').files[0];

            if (!arquivoImagem) {
                alert('Por favor, selecione uma imagem.');
                return;
            }

            // Feedback visual de carregamento
            const submitBtn = formProduto.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
            submitBtn.disabled = true;

            const resultado = await cadastrarProduto(nome, categoria, descricao, preco, loja, link, arquivoImagem);
            
            if (resultado.success) {
                alert('Produto cadastrado com sucesso!');
                formProduto.reset();
            } else {
                alert(`Erro: ${resultado.error}`);
            }
            
            // Restaurar botão
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
    }
});