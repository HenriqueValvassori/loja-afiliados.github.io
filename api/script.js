// Importe o cliente do Supabase

// **ATENÇÃO:** Substitua estes valores pelos do seu projeto Supabase
// Esta abordagem requer um bundler como o Vite ou Webpack para funcionar
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para cadastrar um produto
async function cadastrarProduto(nome, categoria, descricao, preco, arquivoImagem) {
    try {
        // --- 1. UPLOAD DA IMAGEM ---

        // Gerar um nome único para o arquivo para evitar conflitos
        const nomeArquivoUnico = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}_${arquivoImagem.name}`;

        // Fazer o upload do arquivo para o bucket 'imagens_produtos'
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('imagens_produtos')
            .upload(nomeArquivoUnico, arquivoImagem);

        if (uploadError) {
            console.error('Erro no upload da imagem:', uploadError.message);
            throw new Error('Falha no upload da imagem.');
        }

        // Obter a URL pública da imagem após o upload
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
                    imagem_url: publicUrl,
                },
            ]);

        if (insertError) {
            console.error('Erro ao inserir dados do produto:', insertError.message);
            // Se falhar, você pode querer remover a imagem que foi carregada
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
// Em um formulário HTML, por exemplo, você pode pegar os valores assim:

// Supondo que você tenha um formulário com campos de input e um botão
// e um campo de input de tipo file para a imagem.
const form = document.getElementById('form-produto');
const inputNome = document.getElementById('nome');
const inputCategoria = document.getElementById('categoria');
const inputDescricao = document.getElementById('descricao');
const inputPreco = document.getElementById('preco');
const inputImagem = document.getElementById('imagem');

form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede o envio padrão do formulário

    const nome = inputNome.value;
    const categoria = inputCategoria.value;
    const descricao = inputDescricao.value;
    const preco = parseFloat(inputPreco.value);
    const arquivoImagem = inputImagem.files[0];

    if (!arquivoImagem) {
        alert('Por favor, selecione uma imagem.');
        return;
    }

    const resultado = await cadastrarProduto(nome, categoria, descricao, preco, arquivoImagem);
    
    if (resultado.success) {
        alert('Produto cadastrado com sucesso!');
        form.reset(); // Limpa o formulário
    } else {
        alert(`Erro: ${resultado.error}`);
    }
});