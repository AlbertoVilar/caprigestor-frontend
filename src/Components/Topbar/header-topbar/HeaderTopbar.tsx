import '../../../index.css'
import ButtonPrimary from '../../buttons/ButtonPrimary';
import './styles.css'
export default function HeaderTopbar() {

    return (
    
  
          <header className="topbar">
        
        <h1>Bem-vindo ao CapriGestor</h1>
            
            <div className="button-group">
            <ButtonPrimary />
            <a href="../Creat-Goat/newGoat.html" className="btn-outline"><i className="fa-solid fa-user-plus"></i> Cadastrar meu capril</a>
            </div>
     </header>
  
      
    );
}