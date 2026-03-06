import jwt from 'jsonwebtoken';

const secretToken = 'Kaio@3005';

// Função para criar o JWT
function CreateJWT(id) {
  // O payload precisa ser um objeto
  const token = jwt.sign({ id }, secretToken, {
    expiresIn: '7d', // Expiração do token em dias (pode ser em horas, minutos, etc.)
  });

  return token;
}

// Função para validar o JWT
function ValidateJWT(req, res, next) {
  const authToken = req.headers.authorization;

  if (!authToken) {
    return res.status(401).send({ error: 'Token não fornecido' });
  }

  // Corrigir o split para pegar o token corretamente (espera-se "Bearer token")
  const [bearer, token] = authToken.split(' ');

  // Verificar se o token é válido
  if (bearer !== 'Bearer' || !token) {
    return res.status(401).send({ error: 'Token inválido ou mal formatado' });
  }

  jwt.verify(token, secretToken, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: 'Token inválido' });
    }

    // Salva o id dentro da requisição para ser usado em outros lugares
    req.id = decoded.id;

    next();
  });
}

export default { CreateJWT, ValidateJWT };
