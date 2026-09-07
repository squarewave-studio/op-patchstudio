import { useAppContext } from '../../context/AppContext';
import { DrumTool } from '../drum/DrumTool';
import { MultisampleTool } from '../multisample/MultisampleTool';
import { LibraryPage } from '../library/LibraryPage';
import { DesktopPage } from './DesktopPage';
import { TabNavigation } from './TabNavigation';
import { FEATURE_FLAGS } from '../../utils/constants';
import { ANALYTICS_EVENTS, capture } from '../../utils/analytics';

export function MainTabs() {
  const { state, dispatch } = useAppContext();

  const handleTabChange = (tabName: 'drum' | 'multisample' | 'library' | 'desktop') => {
    dispatch({ type: 'SET_TAB', payload: tabName });
    capture(ANALYTICS_EVENTS.PAGE_VIEWED, { page: tabName });
  };

  const tabPanelStyle = {
    background: 'var(--color-bg-primary)',
    borderRadius: '15px',
    border: '1px solid var(--color-border-subtle)',
    borderTop: 'none',
    minHeight: '500px',
    overflow: 'hidden'
  };

  return (
    <div 
      role="tabpanel"
      aria-label="main application content"
      style={{ marginBottom: '2rem' }}
    >
      <TabNavigation currentTab={state.currentTab} onTabChange={handleTabChange} />
      
      {/* Tab Content */}
      {state.currentTab === 'drum' && (
        <div 
          role="tabpanel"
          id="drum-tabpanel"
          aria-labelledby="drum-tab"
          aria-label="drum tool content"
          style={tabPanelStyle}
        >
          <DrumTool />
        </div>
      )}
      
      {state.currentTab === 'multisample' && (
        <div 
          role="tabpanel"
          id="multisample-tabpanel"
          aria-labelledby="multisample-tab"
          aria-label="multisample tool content"
          style={tabPanelStyle}
        >
          <MultisampleTool />
        </div>
      )}
      
      {state.currentTab === 'desktop' && FEATURE_FLAGS.DESKTOP_PAGE && (
        <div
          role="tabpanel"
          id="desktop-tabpanel"
          aria-labelledby="desktop-tab"
          aria-label="desktop app content"
          style={tabPanelStyle}
        >
          <DesktopPage />
        </div>
      )}
      
      {state.currentTab === 'library' && (
        <div
          role="tabpanel"
          id="library-tabpanel"
          aria-labelledby="library-tab"
          aria-label="preset library content"
          style={tabPanelStyle}
        >
          <LibraryPage />
        </div>
      )}
    </div>
  );
}