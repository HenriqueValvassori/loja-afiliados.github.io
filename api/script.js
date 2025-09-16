// **ATENÇÃO:** Substitua estes valores pelos do seu projeto Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// A função agora recebe 'loja' e 'link' como parâmetros
async function cadastrarProduto(nome, categoria, descricao, preco, loja, link, arquivoImagem) {
    try {
        // --- 1. UPLOAD DA IMAGEM ---
        const nomeArquivoUnico = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}_${arquivoImagem.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('imagens_produtos')
            .upload(nomeArquivoUnico, arquivoImagem);

        if (uploadError) {
            console.error('Erro no upload da imagem:', uploadError.message);
            throw new Error('Falha no upload da imagem.');
        }

        const { data: { publicUrl } } = supabase
            .storage
            .from('imagens_produtos')
            .getPublicUrl(nomeArquivoUnico);
        
        console.log('Imagem enviada com sucesso! URL:', publicUrl);

        // --- 2. INSERIR DADOS DO PRODUTO NA TABELA ---
        const { data: insertData, error: insertError } = await supabase
            .from('produtos')
            .insert([
                {
                    nome: nome,
                    categoria: categoria,
                    descricao: descricao,
                    preco: preco,
                    loja: loja,       // <-- Novo campo
                    link: link,       // <-- Novo campo
                    imagem_url: publicUrl,
                },
            ]);

        if (insertError) {
            console.error('Erro ao inserir dados do produto:', insertError.message);
            await supabase.storage.from('imagens_produtos').remove([nomeArquivoUnico]);
            throw new Error('Falha ao cadastrar o produto no banco de dados.');
        }

        console.log('Produto cadastrado com sucesso!');
        return { success: true, data: insertData };

    } catch (error) {
        console.error('Erro geral no cadastro:', error.message);
        return { success: false, error: error.message };
    }
}

// --- Exemplo de como usar a função ---
const form = document.getElementById('form-produto');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const inputNome = document.getElementById('nome');
    const inputCategoria = document.getElementById('categoria');
    const inputDescricao = document.getElementById('descricao');
    const inputPreco = document.getElementById('preco');
    const inputLoja = document.getElementById('loja'); // <-- Novo campo
    const inputLink = document.getElementById('link'); // <-- Novo campo
    const inputImagem = document.getElementById('imagem');

    const nome = inputNome.value;
    const categoria = inputCategoria.value;
    const descricao = inputDescricao.value;
    const preco = parseFloat(inputPreco.value);
    const loja = inputLoja.value;     // <-- Novo valor
    const link = inputLink.value;     // <-- Novo valor
    const arquivoImagem = inputImagem.files[0];

    if (!arquivoImagem) {
        alert('Por favor, selecione uma imagem.');
        return;
    }

    // A chamada da função agora inclui 'loja' e 'link'
    const resultado = await cadastrarProduto(nome, categoria, descricao, preco, loja, link, arquivoImagem);
    
    if (resultado.success) {
        alert('Produto cadastrado com sucesso!');
        form.reset();
    } else {
        alert(`Erro: ${resultado.error}`);
    }
});