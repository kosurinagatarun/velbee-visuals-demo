import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { appBasePath, isBuildingOnlyMode } from './config/visuals'
import { ContentProvider } from './data/ContentContext'
import { BuildingPage } from './pages/BuildingPage'
import { ExteriorPage } from './pages/ExteriorPage'
import { FloorPage } from './pages/FloorPage'
import { PanoPage } from './pages/PanoPage'
import { UnitTourPage } from './pages/UnitTourPage'

export default function App() {
  const buildingOnly = isBuildingOnlyMode()

  return (
    <ContentProvider>
      <BrowserRouter basename={appBasePath().replace(/\/$/, '') || undefined}>
        <Routes>
          <Route path="/" element={<BuildingPage />} />
          {buildingOnly ? null : (
            <>
              <Route path="/exterior" element={<ExteriorPage />} />
              <Route path="/unit-tour" element={<UnitTourPage />} />
              <Route path="/floors/:level" element={<FloorPage />} />
              <Route path="/pano" element={<PanoPage />} />
            </>
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ContentProvider>
  )
}
