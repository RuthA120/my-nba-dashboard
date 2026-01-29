import BasketballGif from '../assets/basketball-loading.gif';
import './Loader.css';

export default function Loader() {
  return (
    <div className="loading-container">
      <img src={BasketballGif} alt="Basketball" className="loader-basketball-gif" />
    </div>
  );
}
