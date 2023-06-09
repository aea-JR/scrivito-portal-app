import * as Scrivito from 'scrivito'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import { SubnavigationOverview } from './SubnavigationOverviewObjClass'

Scrivito.provideLayoutComponent(SubnavigationOverview, ({ page }) => {
  return (
    <>
      <section className="bg-light-grey py-2 hidden-xs">
        <div className="container">
          <Breadcrumb page={page} />
        </div>
      </section>
      <section className="py-4">
        <div className="container">
          <div className="row">
            <div className="col-lg-3">
              <Subnavigation page={page} />
            </div>

            <div className="col-lg-9">
              <Scrivito.CurrentPage />
            </div>
          </div>
        </div>
      </section>
    </>
  )
})

const Breadcrumb = Scrivito.connect(function Breadcrumb({
  page,
}: {
  page: Scrivito.Obj
}) {
  const currentPage = Scrivito.currentPage()
  if (!currentPage) return <nav aria-label="breadcrumb" />

  const breadcrumbItems = calculateBreadcrumbItems({
    ancestor: page,
    descendant: currentPage,
  })

  return (
    <nav aria-label="breadcrumb">
      <ol className="breadcrumb m-1">
        {breadcrumbItems.map((obj) => (
          <li className="breadcrumb-item" key={obj.id()}>
            <Scrivito.LinkTag to={obj}>{objTitle(obj)}</Scrivito.LinkTag>
          </li>
        ))}
        <li className="breadcrumb-item active">{objTitle(currentPage)}</li>
      </ol>
    </nav>
  )
})

function calculateBreadcrumbItems({
  ancestor,
  descendant,
}: {
  ancestor: Scrivito.Obj
  descendant: Scrivito.Obj
}): Scrivito.Obj[] {
  if (ancestor.id() === descendant.id()) return []

  const result: Scrivito.Obj[] = []

  let item = descendant.parent()
  while (item) {
    result.unshift(item)
    item = item.id() === ancestor.id() ? null : item.parent()
  }

  return result
}

const Subnavigation = Scrivito.connect(function Subnavigation({
  page,
}: {
  page: Scrivito.Obj
}) {
  return (
    <Navbar expand="lg" collapseOnSelect={true}>
      <div>
        <Navbar.Toggle className="btn mb-3 w-100">
          <span className="d-flex px-2 justify-content-between align-items-center w-100">
            <span>Menu</span>
            <span className="navbar-toggler-default">
              <i className="bi-list"></i>
            </span>
            <span className="navbar-toggler-toggled">
              <i className="bi-x"></i>
            </span>
          </span>
        </Navbar.Toggle>
      </div>
      <Navbar.Collapse id="nav-sidebar">
        <Scrivito.ChildListTag
          className="nav-bordered"
          tag="ul"
          parent={page}
          renderChild={(child) => (
            <li className={Scrivito.isOnCurrentPath(child) ? 'active' : ''}>
              <Nav.Link
                href={Scrivito.urlFor(child)}
                onClick={(event: React.MouseEvent<HTMLElement>) => {
                  event.preventDefault()

                  Scrivito.navigateTo(child)
                }}
              >
                {objIconAndTitle(child)}
              </Nav.Link>
            </li>
          )}
        />
      </Navbar.Collapse>
    </Navbar>
  )
})

function objTitle(obj: Scrivito.Obj) {
  const title = obj.get('title')

  return typeof title === 'string' && title ? title : '<untitled>'
}

export function objIconAndTitle(obj: Scrivito.Obj) {
  const linkIcon = obj.get('linkIcon')
  const showLinkIcon = typeof linkIcon === 'string'

  return (
    <>
      {showLinkIcon && (
        <>
          <i className={`bi ${linkIcon}`}></i>
        </>
      )}
      {objTitle(obj)}
    </>
  )
}