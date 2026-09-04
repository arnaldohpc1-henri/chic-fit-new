# Chic & Fit — site da loja

Site da loja de roupas fitness Chic & Fit: vitrine de produtos, carrinho de
compras e checkout. Construído com Next.js (App Router) + Tailwind CSS.

## Rodando o projeto

```bash
npm install
npm run dev
```

Depois acesse http://localhost:3000

## Onde editar as coisas

- **Produtos** (nome, preço, cor, tamanhos, descrição, fotos): `src/lib/products.ts`
- **Fotos dos produtos**: `public/products/` — adicione o arquivo e referencie o caminho em `products.ts`
- **WhatsApp, Instagram, e-mail, frete grátis**: `src/config/site.ts`
- **Cores e fontes do site**: `src/app/globals.css`

## Peças "Em breve"

5 peças já estão na vitrine com fotos reais, mas ainda sem preço/descrição
final (`isDraft: true` em `products.ts`): Macaquinho Pink, Macaquinho
Amarelo, Conjunto Preto e Conjunto Vermelho. Elas aparecem na loja com a
etiqueta "Em breve" e um botão para perguntar no WhatsApp em vez de comprar.
Assim que você tiver preço e descrição, edite o produto em `products.ts`,
remova `isDraft: true`, preencha `price`, `sizes` e `description`/`details` —
a peça passa a vender normalmente.

## Como funciona a venda hoje

O checkout coleta os dados do cliente e do endereço, cria o pedido via
`/api/pedidos` e leva o cliente para uma página de confirmação com um botão
**"Enviar pedido pelo WhatsApp"** já com o resumo do pedido preenchido —
assim a loja recebe o pedido e combina pagamento/frete diretamente. Isso já
permite vender pelo site hoje, sem gateway de pagamento configurado.

Como ainda não há banco de dados, o pedido usado na página de confirmação
vem do próprio navegador do cliente (`sessionStorage`, gerado no momento da
compra) — funciona em qualquer hospedagem, inclusive serverless (Vercel).
`createOrder` (`src/lib/orders.ts`) também tenta gravar em `data/orders.json`
como registro extra, mas isso só persiste rodando localmente; não é a fonte
usada para mostrar a confirmação.

## Integrando pagamento online (próximo passo)

Ainda não há Stripe/Mercado Pago conectado. Quando quiser ativar pagamento
por cartão/Pix direto no site:

1. Criar conta no gateway escolhido (Stripe ou Mercado Pago) e pegar as chaves de API.
2. Em `src/app/api/pedidos/route.ts`, no lugar do comentário `NOTE:`, criar a
   cobrança/checkout session do gateway com os itens do pedido.
3. Redirecionar o cliente para a página de pagamento do gateway em vez da
   página de confirmação atual (ou usar webhooks do gateway para atualizar
   `status` do pedido).
4. Trocar `createOrder`/`getOrder` (`src/lib/orders.ts`) por um banco de
   dados de verdade antes de depender de histórico de pedidos no servidor —
   hoje o registro em `data/orders.json` é só um extra local, não confiável
   em produção.

## Observações técnicas

- O projeto vive em `C:\Users\Usuario\Documents\chic-fit` (fora da pasta
  `Chic&Fit`) porque o caractere `&` no caminho quebra o instalador de
  scripts do npm no Windows. O nome da marca no site continua "Chic & Fit"
  normalmente — isso afeta só o nome da pasta no computador.
