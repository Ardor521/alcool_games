import { Link, useParams } from 'react-router-dom'
import { GAMES } from '../lib/catalog'
import { useParty } from '../context/PartyContext'
import { GameShell } from '../components/GameShell'
import { PicoloGame } from '../games/PicoloGame'
import { NeverGame } from '../games/NeverGame'
import { VoteGame } from '../games/VoteGame'
import { TruthGame } from '../games/TruthGame'
import { BottleBoard } from '../games/BottleBoard'
import { KingsBoard } from '../games/KingsBoard'
import { RouletteGame } from '../games/RouletteGame'
import { MiniBusBoard } from '../games/MiniBusBoard'
import { CasinoGame } from '../games/CasinoGame'
import { PyramidBoard } from '../games/PyramidBoard'
import { RideBusBoard } from '../games/RideBusBoard'
import { RedBlackBoard } from '../games/RedBlackBoard'
import { HorsesBoard } from '../games/HorsesBoard'
import { RatherGame } from '../games/RatherGame'
import { NoYesGame } from '../games/NoYesGame'
import { BacGame } from '../games/BacGame'
import { ThreeSixNineGame } from '../games/ThreeSixNineGame'
import { MexicanBoard } from '../games/MexicanBoard'
import { LieGame } from '../games/LieGame'
import { ImpostorGame } from '../games/ImpostorGame'
import { BeerPongGame } from '../games/BeerPongGame'
import { PowerHourGame } from '../games/PowerHourGame'
import { DiceBoard } from '../games/DiceBoard'
import { MimeGame } from '../games/MimeGame'
import { CategoriesGame } from '../games/CategoriesGame'
import { RpsGame } from '../games/RpsGame'
import { HotSeatGame } from '../games/HotSeatGame'
import { WarBattle } from '../games/WarBattle'
import { LiarDiceGame } from '../games/LiarDiceGame'

function GameSwitch({ id }: { id: string }) {
  switch (id) {
    case 'picolo':
      return <PicoloGame />
    case 'jamais':
      return <NeverGame />
    case 'vote':
      return <VoteGame />
    case 'verite':
      return <TruthGame />
    case 'bouteille':
      return <BottleBoard />
    case 'roi':
      return <KingsBoard />
    case 'roulette':
      return <RouletteGame />
    case 'minibus':
      return <MiniBusBoard />
    case 'casino':
      return <CasinoGame />
    case 'pyramide':
      return <PyramidBoard />
    case 'dealer':
      return <RideBusBoard />
    case 'rougenoir':
      return <RedBlackBoard />
    case 'chevaux':
      return <HorsesBoard />
    case 'tuprefere':
      return <RatherGame />
    case 'nioiuinon':
      return <NoYesGame />
    case 'bac':
      return <BacGame />
    case 'trois':
      return <ThreeSixNineGame />
    case 'mexicain':
      return <MexicanBoard />
    case 'mensonge':
      return <LieGame />
    case 'imposteur':
      return <ImpostorGame />
    case 'beerpong':
      return <BeerPongGame />
    case 'powerhour':
      return <PowerHourGame />
    case 'des':
      return <DiceBoard />
    case 'mime':
      return <MimeGame />
    case 'categories':
      return <CategoriesGame />
    case 'rps':
      return <RpsGame />
    case 'hotseat':
      return <HotSeatGame />
    case 'bataille':
      return <WarBattle />
    case 'liardice':
      return <LiarDiceGame />
    default:
      return null
  }
}

export function PlayGame() {
  const { id } = useParams()
  const { activePlayers } = useParty()
  const game = GAMES.find((g) => g.id === id)

  if (!game) {
    return (
      <div className="card space-y-3 p-6 text-center">
        <p className="font-display text-2xl">Jeu introuvable</p>
        <Link to="/jeux" className="btn-primary justify-center">
          Retour aux jeux
        </Link>
      </div>
    )
  }

  if (activePlayers.length < game.minPlayers) {
    return (
      <div className="card space-y-3 p-6 text-center">
        <p className="font-display text-2xl">Pas assez de joueurs actifs</p>
        <p className="text-sm text-white/60">
          {game.title} demande au moins {game.minPlayers} joueurs (hors pause).
        </p>
        <Link to="/joueurs" className="btn-primary justify-center">
          Ajouter des joueurs
        </Link>
      </div>
    )
  }

  return (
    <GameShell game={game}>
      <GameSwitch id={game.id} />
    </GameShell>
  )
}