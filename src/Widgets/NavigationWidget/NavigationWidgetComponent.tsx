import { provideComponent, Obj } from 'scrivito'
import Navbar from 'react-bootstrap/Navbar'

import { NavigationWidget } from './NavigationWidgetClass'
import { Brand } from './SubComponents/Brand'
import { MainNavigation } from './SubComponents/MainNavigation'
import { MetaNavigation } from './SubComponents/MetaNavigation'
import { isHomepage } from '../../Objs/Homepage/HomepageObjClass'

provideComponent(NavigationWidget, ({ widget }) => {
  const root = Obj.root()
  if (!isHomepage(root)) return null

  const searchInputLabel = widget.get('searchInputLabel')

  return (
    <section>
      <div className="container">
        <Navbar expand="lg" collapseOnSelect>
          <Brand root={root} />
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <MetaNavigation widget={widget} root={root} />
            <MainNavigation root={root} searchInputLabel={searchInputLabel} />
          </Navbar.Collapse>
        </Navbar>
      </div>
    </section>
  )
})
