import { AuthError,requireUser,authPool,json } from '../lib/auth.js';
export default async function handler(req,res){
 try{
  if(req.method!=='GET'){res.setHeader('Allow','GET');throw new AuthError('Método não permitido.',405);}
  const user=await requireUser(req,'admin');
  const {rows}=await authPool().query('select (select count(*)::int from stoffels.products) as products,(select count(*)::int from stoffels.users where role=\'customer\') as customers,(select count(*)::int from stoffels.orders) as orders');
  json(res,200,{user,summary:rows[0]});
 }catch(error){json(res,error instanceof AuthError?error.status:503,{error:error instanceof AuthError?error.message:'Administração indisponível.'});}
}
