describe('Navigation', () => {
  beforeEach(() => {
    cy.visitLoggedIn('/');
  });

  describe('Core api navigation test', () => {
    it('Core API navigate', () => {
      cy.window().then(win => {
        win.Luigi.navigation().navigate('/projects/pr2');
        cy.expectPathToBe('/projects/pr2');
      });
    });
    it('Core API navigate to root', () => {
      cy.window().then(win => {
        win.Luigi.navigation().navigate('/');
        cy.expectPathToBe('/overview');
      });
    });
    it('Core API prevent open root in modal', () => {
      cy.window().then(win => {
        cy.stub(win.console, 'warn').as('consoleWarn');
        win.Luigi.navigation().openAsModal('/');

        cy.get('div[data-testid="modal-mf"]').should('not.exist');
        cy.get('@consoleWarn').should('be.calledWith', 'Navigation with an absolute path prevented.');
        cy.expectPathToBe('/overview');
      });
    });
    it('Core API prevent open root in drawer', () => {
      cy.window().then(win => {
        cy.stub(win.console, 'warn').as('consoleWarn');
        win.Luigi.navigation().openAsDrawer('/');

        cy.get('div[data-testid="drawer-mf"]').should('not.exist');
        cy.get('@consoleWarn').should('be.calledWith', 'Navigation with an absolute path prevented.');
        cy.expectPathToBe('/overview');
      });
    });
    it('Core API prevent open root in splitview', () => {
      cy.window().then(win => {
        cy.stub(win.console, 'warn').as('consoleWarn');
        const handle = win.Luigi.navigation().openAsSplitView('/', {
          title: 'Preserved Split View',
          size: '40',
          collapsed: false
        });
        setTimeout(() => {
          cy.get('#splitViewContainer').should('not.be.visible');
          cy.expect(handle.exists()).to.be.true;
        }, 0);
        cy.expectPathToBe('/overview');
        cy.get('@consoleWarn').should('be.calledWith', 'Navigation with an absolute path prevented.');
      });
    });
    it('Core API open in dialog', () => {
      cy.window().then(win => {
        win.Luigi.navigation().openAsModal('/settings', {
          title: 'Preserved View',
          size: 'm'
        });

        cy.get('button[aria-label="close"]')
          .should('exist')
          .click();
        cy.expectPathToBe('/overview');
      });
    });
    it('Core API open and close in SplitView', done => {
      cy.get('.fd-shellbar').should('be.visible');
      cy.window().then(win => {
        const handle = win.Luigi.navigation().openAsSplitView('/ext', {
          title: 'Preserved Split View',
          size: '40',
          collapsed: false
        });
        setTimeout(() => {
          cy.get('#splitViewContainer').should('be.visible');
          cy.expect(handle.exists()).to.be.true;
        }, 0);
        // It is not totally clear why it is not working without timeout, but it seems like a race condition
        // TODO: Check stackoverflow for solution
        // https://stackoverflow.com/questions/60338487/cypress-executes-assertion-immediately-on-function-that-returns-a-handle
        setTimeout(() => {
          handle.close();
          setTimeout(() => {
            cy.expect(handle.exists()).to.be.false;
            cy.get('#splitViewContainer').should('not.be.visible');
            done();
          }, 50);
        }, 50);
      });
    });
    it('Core API collapse in SplitView', () => {
      cy.window().then(win => {
        const handle = win.Luigi.navigation().openAsSplitView('/ext', {
          title: 'Preserved Split View',
          size: '40',
          collapsed: false
        });
        handle.collapse();
        cy.expect(handle.isCollapsed()).to.be.true;
      });
    });
    it('Core API expand SplitView', () => {
      cy.window().then(win => {
        const handle = win.Luigi.navigation().openAsSplitView('/ext', {
          title: 'Preserved Split View',
          size: '40',
          collapsed: false
        });
        handle.expand();
        cy.expect(handle.isExpanded()).to.be.true;
      });
    });
    it('Core API open collapsed splitview and check if expand container will disappear after navigation', () => {
      cy.get('.fd-shellbar').should('be.visible');
      cy.window().then(win => {
        const handle = win.Luigi.navigation().openAsSplitView('/overview', {
          title: 'Preserved Split View',
          size: '40',
          collapsed: true
        });
        cy.get('#splitViewContainer').should('be.visible');
        cy.get('.fd-shellbar')
          .contains('Projects')
          .click();
        cy.expectPathToBe('/projects');
        cy.get('#splitViewContainer').should('not.be.visible');
      });
    });
    it('Core API navigate with params', () => {
      cy.window().then(win => {
        win.Luigi.navigation()
          .withParams({ test: true })
          .navigate('/settings');
        cy.expectPathToBe('/settings');
        cy.expectSearchToBe('?~test=true');
        cy.getIframeBody().then($iframeBody => {
          cy.wrap($iframeBody).should('contain', '"test": "true"');
        });
      });
    });
    it('Core API navigate back & forth from node w/ params to node w/o params', () => {
      cy.window().then(win => {
        win.Luigi.navigation()
          .withParams({ test: true })
          .navigate('/settings');
        cy.expectPathToBe('/settings');
        cy.expectSearchToBe('?~test=true');
        cy.getIframeBody().then($iframeBody => {
          cy.wrap($iframeBody).should('contain', '"test": "true"');
        });
      });
      cy.window().then(win => {
        win.Luigi.navigation().navigate('/settings');
        cy.expectPathToBe('/settings');
        cy.expectSearchToBe('');
        cy.getIframeBody().then($iframeBody => {
          cy.wrap($iframeBody).should('not.contain', '"test": "true"');
        });
      });
      cy.window().then(win => {
        win.Luigi.navigation()
          .withParams({ test: true })
          .navigate('/settings');
        cy.expectPathToBe('/settings');
        cy.expectSearchToBe('?~test=true');
        cy.getIframeBody().then($iframeBody => {
          cy.wrap($iframeBody).should('contain', '"test": "true"');
        });
      });
    });
  });

  describe('Normal navigating', () => {
    it('Click around using navigation', () => {
      // projects page
      cy.get('.fd-shellbar')
        .contains('Projects')
        .click();

      //projects page
      cy.get('.fd-app__sidebar').should('contain', 'Project One');
      cy.get('.fd-app__sidebar').should('contain', 'Project Two');
      cy.get('.fd-app__sidebar')
        .contains('Project One')
        .click();

      //project one page
      cy.expectPathToBe('/projects/pr1');

      cy.get('.fd-app__sidebar').should('not.contain', 'Project One');
      cy.get('.fd-app__sidebar').should('contain', 'Miscellaneous2');
      cy.get('.fd-app__sidebar')
        .contains('Default Child node Example')
        .click();

      //default child node example
      cy.expectPathToBe('/projects/pr1/dps/dps2');

      cy.get('.fd-app__sidebar').should('contain', 'First Child');
      cy.get('.fd-app__sidebar').should('contain', 'Second Child');
    });

    it('Find configured testid on navigation node', () => {
      cy.visit('/projects/pr1/settings');
      cy.get('a[data-testid="myTestId"]').should('exist');
    });

    it('Set default testid on navigation node', () => {
      cy.visit('/projects/pr1/developers');
      cy.get('a[data-testid="developers_developers"]').should('exist');
    });

    it('Check if active node is selected', () => {
      cy.visit('/projects');
      cy.get('.fd-shellbar')
        .contains('Projects')
        .should('have.class', 'is-selected');

      cy.visit('projects/pr1');
      cy.get('.fd-nested-list')
        .contains('Project Settings')
        .click()
        .should('have.class', 'is-selected');
    });

    it('Check if active node reloads page', () => {
      cy.visit('/projects/pr1/developers');
      cy.getIframeBody().then($iframeBody => {
        cy.wrap($iframeBody)
          .should('contain', 'Developers content')
          .find('[title="visitors: 1"]');
        cy.get('.fd-app__sidebar')
          .contains('Project Settings')
          .click();
        cy.get('.fd-app__sidebar')
          .contains('Developers')
          .click();
        cy.wrap($iframeBody).find('[title="visitors: 2"]');
      });
      cy.get('.fd-app__sidebar')
        .contains('Developers')
        .click();
      cy.getIframeBody().then($iframeBody => {
        cy.wrap($iframeBody).find('[title="visitors: 1"]');
      });
    });

    it('Browser back works with Default Child mechanism', () => {
      cy.getIframeBody().then($iframeBody => {
        cy.wrap($iframeBody)
          .contains('defaultChildNode')
          .click();
        cy.expectPathToBe('/projects/pr1/dps/dps2');
        cy.window().historyBack();
        cy.expectPathToBe('/overview');
      });
    });

    it('Icon instead of label in TopNav', () => {
      cy.get('[data-testid="settings_settings"]>.fd-top-nav__icon').should('exist');
      cy.get('[data-testid="settings_settings"]').should('contain', '');
    });

    it('Icon with label label in TopNav', () => {
      cy.get('[data-testid="icon-and-label"]>.fd-top-nav__icon').should('exist');
      cy.get('[data-testid="icon-and-label"]').should('contain', 'Git');
    });

    it('Icon with label in LeftNav', () => {
      cy.get('.fd-shellbar')
        .contains('Projects')
        .click();
      cy.get('.fd-app__sidebar .fd-nested-list__item')
        .contains('Project One')
        .click();

      cy.get('.fd-nested-list__item')
        .contains('Project Settings')
        .find('.fd-nested-list__icon')
        .should('exist');
    });

    it('Shows Luigi version in LeftNav', () => {
      // projects page
      cy.get('.fd-shellbar')
        .contains('Projects')
        .click();

      cy.get('.fd-app__sidebar .lui-side-nav__footer')
        .contains('Luigi Client:')
        .should('be.visible');

      cy.window().then(win => {
        const config = win.Luigi.getConfig();
        config.settings.sideNavFooterText = 'Hello from tets.';
        win.Luigi.configChanged('settings.footer');

        cy.get('.fd-app__sidebar .lui-side-nav__footer')
          .contains('Hello from tets.')
          .should('be.visible');
      });
    });

    it('Side nav does not broken while clicking empty viewUrl node', () => {
      cy.get('.fd-shellbar')
        .contains('Projects')
        .click();

      cy.get('.fd-app__sidebar .fd-nested-list__item')
        .contains('Project One')
        .click();

      cy.get('.fd-side-nav')
        .contains('Empty viewUrl node')
        .click();

      cy.get('.fd-side-nav').should('contain', 'Empty viewUrl node');
    });

    it('Redirect to root path while reaching empty viewUrl node directly', () => {
      cy.visit('/projects/pr2/emptyViewUrl');

      cy.get('[data-testid=luigi-alert]').should('have.class', 'fd-message-strip--error');
      cy.expectPathToBe('/overview');
    });
  });

  describe('Node activation hook', () => {
    const nodeActivationPath = '/projects/pr1/on-node-activation';
    it('does not navigate - synchronously', () => {
      cy.visitLoggedIn(nodeActivationPath);

      cy.getIframeBody().then($iframeBody => {
        cy.wrap($iframeBody)
          .find('[data-testid="node-activation-no-navigation"]')
          .click();

        cy.expectPathToBe(nodeActivationPath);
        cy.get('[data-testid="luigi-alert"]').contains('Showing an alert instead of navigating');
      });
    });

    it('does not navigate - asynchronously (from left navigation)', () => {
      cy.visitLoggedIn(nodeActivationPath);

      cy.get('.sap-icon--question-mark').click();

      cy.get('[data-testid=luigi-modal-dismiss]').click();

      cy.expectPathToBe(nodeActivationPath);
    });

    it('navigates - asynchronously', () => {
      cy.visitLoggedIn(nodeActivationPath);

      cy.getIframeBody().then($iframeBody => {
        // wrap the body of your iframe with cy so as to do cy actions inside iframe elements
        cy.wrap($iframeBody)
          .find('[data-testid="node-activation-conditional-navigation"]')
          .click();

        cy.get('[data-testid=luigi-modal-confirm]').click();

        cy.expectPathToBe(`${nodeActivationPath}/navigated`);
      });
    });
  });

  // Disabled, since it only works if autologin is false
  /*
  it('Anonymous content', () => {
    cy.get('.fd-shellbar')
      .contains('Visible for all users')
      .should('exist');

    cy.get('.fd-shellbar')
      .contains('Visible for anonymous users only')
      .should('not.exist');
  });
  */

  describe('features', () => {
    it(
      'keepSelectedForChildren',
      {
        retries: {
          runMode: 3,
          openMode: 3
        }
      },
      () => {
        // keep selected for children example
        cy.get('.fd-shellbar')
          .contains('Overview')
          .click();

        cy.wait(500);
        // dig into the iframe

        cy.getIframeBody().then($iframeBody => {
          cy.wrap($iframeBody)
            .find('.fd-list__item')
            .contains('keepSelectedForChildren')
            .click();
          cy.wait(500);
        });

        cy.expectPathToBe('/projects/pr1/avengers');

        //the iframe is has been replaced with another one, we need to "get" it again
        cy.getIframeBody().then($iframeBody => {
          // wrap this body with cy so as to do cy actions inside iframe elements
          cy.wrap($iframeBody)
            .find('.fd-list__item')
            .contains('Thor')
            .click();
          cy.wait(500);
        });
        cy.expectPathToBe('/projects/pr1/avengers/thor');

        cy.get('.fd-app__sidebar').should('contain', 'Keep Selected Example');
      }
    );

    it('Node with link to another node', () => {
      const goToAnotherNodeFeature = () => {
        cy.get('.fd-shellbar')
          .contains('Overview')
          .click();

        cy.wait(500);
        cy.getIframeBody().then($iframeBody => {
          cy.wrap($iframeBody)
            .find('.fd-list__item strong')
            .contains('Node with link to another node')
            .click();
        });
      };

      //go to absolute path
      goToAnotherNodeFeature();
      cy.get('.fd-app__sidebar .fd-nested-list__item')
        .contains('Go to absolute path')
        .click();

      cy.expectPathToBe('/settings');

      //go to relative path from the parent node
      goToAnotherNodeFeature();
      cy.get('.fd-app__sidebar .fd-nested-list__item')
        .contains('Go to relative path')
        .click();

      cy.expectPathToBe('/projects/pr2/dps/dps1');

      //go to relative path from node that is a sibiling
      goToAnotherNodeFeature();
      cy.get('.fd-app__sidebar .fd-nested-list__item')
        .contains('Keep Selected Example')
        .click();

      cy.expectPathToBe('/projects/pr2/avengers');

      cy.get('.fd-app__sidebar .fd-nested-list__item')
        .contains('Go to relative path')
        .click();

      cy.expectPathToBe('/projects/pr2/dps/dps1');
    });

    it('Left navigation hidden', () => {
      cy.get('.fd-shellbar')
        .contains('Projects')
        .click();
      cy.get('.fd-app__sidebar .fd-nested-list__item')
        .contains('Project One')
        .click();

      cy.get('.fd-app__sidebar')
        .contains('Hide left navigation')
        .click();

      cy.get('.no-side-nav').should('exist');
      cy.get('.fd-app__sidebar').should('not.be.visible');
    });

    it('Open navigation node in a modal', () => {
      // projects page
      cy.get('.fd-shellbar')
        .contains('Projects')
        .click();

      //projects page
      cy.get('.fd-app__sidebar')
        .contains('Project Two')
        .click();

      //project two page
      cy.expectPathToBe('/projects/pr2');

      cy.get('.fd-app__sidebar')
        .contains('Miscellaneous2')
        .click();

      cy.get('[data-testid=modal-mf]').should('be.visible');

      cy.get('[data-testid=modal-mf] [aria-label=close]').click();

      cy.get('[data-testid=modal-mf]').should('not.be.visible');
    });

    it('Nav sync - click sidenav', () => {
      // projects page
      cy.get('.fd-shellbar')
        .contains('Projects')
        .click();

      //projects page
      cy.get('.fd-app__sidebar')
        .contains('Project Two')
        .click();

      cy.get('.fd-app__sidebar')
        .contains('Nav Sync')
        .click();

      cy.expectPathToBe('/projects/pr2/nav-sync/one');

      ['four', 'three', 'two', 'three', 'two'].forEach(label => {
        cy.get('.fd-app__sidebar')
          .contains(label)
          .click();

        cy.expectPathToBe('/projects/pr2/nav-sync/' + label);

        cy.getIframeBody().then($iframeBody => {
          cy.wrap($iframeBody)
            .find('.fd-list__item')
            .contains('Current pathsegment: ' + label);
        });
      });
    });
    it('Nav sync - use synched nav', () => {
      // projects page
      cy.get('.fd-shellbar')
        .contains('Projects')
        .click();

      //projects page
      cy.get('.fd-app__sidebar')
        .contains('Project Two')
        .click();

      cy.get('.fd-app__sidebar')
        .contains('Nav Sync')
        .click();

      cy.expectPathToBe('/projects/pr2/nav-sync/one');

      const labels = ['two', 'three', 'four', 'one'];
      labels.forEach((label, index) => {
        cy.getIframeBody().then($iframeBody => {
          cy.wrap($iframeBody)
            // .find('.fd-link')
            .contains(label)
            .click();
        });
        cy.expectPathToBe('/projects/pr2/nav-sync/' + label);
      });
    });
  });
  describe('Horizontal Tab Navigation', () => {
    context('Desktop', () => {
      it('Open horizontal navigation', () => {
        cy.get('.fd-shellbar')
          .contains('Projects')
          .click();

        cy.get('.fd-app__sidebar')
          .contains('Horizontal Navigation Example')
          .click();

        cy.expectPathToBe('/projects/tabNav');

        cy.get('.fd-tabs')
          .contains('Node with node activation hook')
          .click();
        cy.expectPathToBe('/projects/tabNav/on-node-activation');

        cy.get('.fd-tabs')
          .contains('Settings')
          .click();
        cy.get('.fd-menu__item')
          .contains('Project Settings')
          .click();
        cy.expectPathToBe('/projects/tabNav/settings');

        cy.get('.fd-tabs')
          .contains('More')
          .click();

        cy.get('.fd-nested-list')
          .contains('Default Child node Example')
          .click();

        cy.get('.fd-nested-list__item')
          .contains('First Child')
          .click();
        cy.expectPathToBe('/projects/tabNav/dps1');
      });
    });

    context('Mobile', () => {
      beforeEach(() => {
        cy.viewport('iphone-6');
      });
      it('Horizontal Navigation on mobile', () => {
        cy.get('[data-testid="mobile-menu"]').click();
        cy.get('.fd-popover__body').within(() => {
          cy.get('[data-testid="projects_projects-mobile"]').click();
        });
        cy.get('.lui-burger').click();
        cy.get('.fd-side-nav').contains('Horizontal Navigation Example');
        cy.get('[data-testid="tabnav_horizontalnavigationexample"]').click();
        cy.get('[data-testid="tabnav_horizontalnavigationexample"]').should('have.class', 'is-selected');
        cy.get('.fd-tabs').contains('User Management');
        cy.get('.fd-tabs__item')
          .contains('Node with node activation hook')
          .should('not.visible');
        cy.get('.fd-tabs').contains('More');
      });

      it('Test activated node on moible with keep selected context', () => {
        cy.visit('/projects/tabNav/avengers/captain-america/super-power');
        cy.get('.luigi__more').should('have.attr', 'aria-selected', 'true');
        cy.get('.luigi__more').click();
        cy.get('.fd-nested-list__title')
          .contains('Keep Selected Example')
          .parent()
          .should('have.attr', 'aria-selected', 'true');
      });

      it('recalc of tab nav by using resizing', () => {
        cy.visit('/projects/tabNav');
        cy.get('.luigi-tabsContainer').within(() => {
          cy.get('.fd-tabs__item')
            .contains('User Management')
            .should('be.visible');
          cy.get('.fd-tabs__item')
            .contains('Node with node activation hook')
            .should('not.visible');
          cy.get('.fd-tabs__item')
            .contains('Settings')
            .should('not.visible');
        });
        cy.viewport(900, 750);
        cy.get('.luigi-tabsContainer').within(() => {
          cy.get('.fd-tabs__item')
            .contains('Settings')
            .should('be.visible');
          cy.get('.fd-tabs__item')
            .contains('Settings')
            .click();
          cy.get('.fd-popover')
            .contains('Project Settings')
            .click();
          cy.expectPathToBe('/projects/tabNav/settings');
          cy.get('.fd-tabs__item')
            .contains('Settings')
            .should('have.attr', 'aria-selected', 'true');
        });
      });

      it('ResponsiveNavigation Semicollapsed', () => {
        cy.viewport(800, 600);
        cy.window().then(win => {
          const config = win.Luigi.getConfig();
          config.settings.responsiveNavigation = 'semiCollapsible';
          win.Luigi.configChanged('settings');
          cy.get('[data-testid="mobile-menu"]').click();

          cy.get('.fd-popover__body').within(() => {
            cy.get('[data-testid="projects_projects-mobile"]').click();
          });
          cy.get('.fd-side-nav').contains('Horizontal Navigation Example');
          cy.get('[data-testid="tabnav_horizontalnavigationexample"]').click();
          cy.get('.fd-tabs__item')
            .contains('Miscellaneous 2')
            .should('not.visible');
          cy.get('[data-testid="semiCollapsibleButton"]').click();
          cy.wait(1000);
          cy.get('.fd-tabs__item')
            .contains('Miscellaneous2')
            .should('be.visible');
        });
      });
    });
  });
  describe('GlobalSearch', () => {
    context('Desktop', () => {
      it('GlobalSearch Desktop', () => {
        cy.get('.luigi-search__input').should('not.be.visible');
        cy.get('[data-testid=luigi-search-btn-desktop]').click();
        cy.get('.luigi-search__input').should('be.visible');
        cy.get('.luigi-search__input').type('Luigi');
        cy.get('[data-testid=luigi-search-btn-desktop]').click();
        cy.get('.luigi-search__input').should('not.be.visible');
        cy.get('[data-testid=luigi-search-btn-desktop]').click();
        cy.get('.luigi-search__input').should('not.have.value', 'Luigi');
      });
    });
    context('Mobile', () => {
      beforeEach(() => {
        cy.viewport('iphone-6');
      });
      it('GlobalSearch Mobile', () => {
        cy.get('.luigi-search-shell__mobile .luigi-search__input').should('not.be.visible');
        cy.get('[data-testid=mobile-menu]').click();
        cy.get('[data-testid=luigi-search-btn-mobile]').click();
        cy.get('.luigi-search-shell__mobile .luigi-search__input').should('be.visible');
        cy.get('.luigi-search-shell__mobile .luigi-search__input').type('Luigi');

        cy.get('[data-testid=mobile-menu]').click();
        cy.get('[data-testid=luigi-search-btn-mobile]').click();
        cy.get('.luigi-search-shell__mobile .luigi-search__input').should('not.be.visible');

        cy.get('[data-testid=mobile-menu]').click();
        cy.get('[data-testid=luigi-search-btn-mobile]').click();
        cy.get('.luigi-search-shell__mobile .luigi-search__input').should('not.have.value', 'Luigi');
      });
    });
  });
  describe('Feature toggles', () => {
    it('Node visibility with feature toggles via url', () => {
      cy.window().then(win => {
        win.Luigi.navigation().navigate('/projects/pr1/settings_ft');
        cy.expectPathToBe('/projects/pr1');
      });
      cy.window().then(win => {
        win.Luigi.navigation().navigate('/projects/pr1/settings_ft?ft=ft1');
        cy.expectPathToBe('/projects/pr1/settings_ft');
      });
      cy.get('.fd-app__sidebar').should('contain', 'Project Settings 2');
      cy.get('.fd-app__sidebar').should('not.contain', 'Project Settings 3');
      cy.getIframeBody().then($iframeBody => {
        cy.wrap($iframeBody).should('contain', 'This is a feature toggle test and only visible if ft1 is active.');
      });
    });

    it('Negate featuretoggle for node visibility', () => {
      cy.visit('/projects/pr1/settings_ft3?ft=ft2');
      cy.get('.fd-app__sidebar').should('not.contain', 'Project Settings 2');
      cy.get('.fd-app__sidebar').should('contain', 'Project Settings 3');
    });
  });
  describe('Collapsible Categories / Accordion', () => {
    it('It should have multiple categories collapsed', () => {
      cy.visit('/projects/pr2/collapsibles');

      cy.get('li[data-testid="superusefulgithublinks"]>ul.fd-nested-list').should('not.be.visible');
      cy.get('li[data-testid="usermanagement"]>ul.fd-nested-list').should('not.be.visible');

      cy.get('li[data-testid="superusefulgithublinks"] a[title="Super useful Github links"]').click();
      cy.get('li[data-testid="usermanagement"] a[title="User Management"]').click();

      cy.get('li[data-testid="superusefulgithublinks"]>ul.fd-nested-list').should('be.visible');
      cy.get('li[data-testid="usermanagement"]>ul.fd-nested-list').should('be.visible');

      cy.get('li[data-testid="superusefulgithublinks"] a[title="Super useful Github links"]').click();
      cy.get('li[data-testid="usermanagement"] a[title="User Management"]').click();

      cy.get('li[data-testid="superusefulgithublinks"]>ul.fd-nested-list').should('not.be.visible');
      cy.get('li[data-testid="usermanagement"]>ul.fd-nested-list').should('not.be.visible');
    });

    it('It should have a local side nav accordion mode', () => {
      cy.visit('/projects/pr2/sidenavaccordionmode');

      // All is closed
      cy.get('li[data-testid="superusefulgithublinks"]>ul.fd-nested-list').should('not.be.visible');
      cy.get('li[data-testid="usermanagement"]>ul.fd-nested-list').should('not.be.visible');

      cy.get('li[data-testid="superusefulgithublinks"] a[title="Super useful Github links"]').click();

      // First one is open only
      cy.get('li[data-testid="superusefulgithublinks"]>ul.fd-nested-list').should('be.visible');
      cy.get('li[data-testid="usermanagement"]>ul.fd-nested-list').should('not.be.visible');

      cy.get('li[data-testid="usermanagement"] a[title="User Management"]').click();

      // Second one is open only
      cy.get('li[data-testid="superusefulgithublinks"]>ul.fd-nested-list').should('not.be.visible');
      cy.get('li[data-testid="usermanagement"]>ul.fd-nested-list').should('be.visible');

      cy.get('li[data-testid="usermanagement"] a[title="User Management"]').click();

      // All is closed
      cy.get('li[data-testid="superusefulgithublinks"]>ul.fd-nested-list').should('not.be.visible');
      cy.get('li[data-testid="usermanagement"]>ul.fd-nested-list').should('not.be.visible');
    });

    it('It should have a global side nav accordion mode', () => {
      cy.visit('/projects/pr2/collapsibles');
      cy.window().then(win => {
        const config = win.Luigi.getConfig();
        config.navigation.defaults = {
          sideNavAccordionMode: true
        };
        win.Luigi.configChanged('settings.navigation');
        // All is closed
        cy.get('li[data-testid="superusefulgithublinks"]>ul.fd-nested-list').should('not.be.visible');
        cy.get('li[data-testid="usermanagement"]>ul.fd-nested-list').should('not.be.visible');

        cy.get('li[data-testid="superusefulgithublinks"] a[title="Super useful Github links"]').click();

        // First one is open only
        cy.get('li[data-testid="superusefulgithublinks"]>ul.fd-nested-list').should('be.visible');
        cy.get('li[data-testid="usermanagement"]>ul.fd-nested-list').should('not.be.visible');

        cy.get('li[data-testid="usermanagement"] a[title="User Management"]').click();

        // Second one is open only
        cy.get('li[data-testid="superusefulgithublinks"]>ul.fd-nested-list').should('not.be.visible');
        cy.get('li[data-testid="usermanagement"]>ul.fd-nested-list').should('be.visible');

        cy.get('li[data-testid="usermanagement"] a[title="User Management"]').click();

        // All is closed
        cy.get('li[data-testid="superusefulgithublinks"]>ul.fd-nested-list').should('not.be.visible');
        cy.get('li[data-testid="usermanagement"]>ul.fd-nested-list').should('not.be.visible');
      });
    });
  });

  describe('Collapsible Categories / Accordion', () => {
    it('It should have multiple categories collapsed', () => {
      cy.visit('/projects/pr2/collapsibles');

      cy.get('li[data-testid="superusefulgithublinks"]>ul.fd-nested-list').should('not.be.visible');
      cy.get('li[data-testid="usermanagement"]>ul.fd-nested-list').should('not.be.visible');

      cy.get('li[data-testid="superusefulgithublinks"] a[title="Super useful Github links"]').click();
      cy.get('li[data-testid="usermanagement"] a[title="User Management"]').click();

      cy.get('li[data-testid="superusefulgithublinks"]>ul.fd-nested-list').should('be.visible');
      cy.get('li[data-testid="usermanagement"]>ul.fd-nested-list').should('be.visible');

      cy.get('li[data-testid="superusefulgithublinks"] a[title="Super useful Github links"]').click();
      cy.get('li[data-testid="usermanagement"] a[title="User Management"]').click();

      cy.get('li[data-testid="superusefulgithublinks"]>ul.fd-nested-list').should('not.be.visible');
      cy.get('li[data-testid="usermanagement"]>ul.fd-nested-list').should('not.be.visible');
    });

    it('It should have a local side nav accordion mode', () => {
      cy.visit('/projects/pr2/sidenavaccordionmode');

      // All is closed
      cy.get('li[data-testid="superusefulgithublinks"]>ul.fd-nested-list').should('not.be.visible');
      cy.get('li[data-testid="usermanagement"]>ul.fd-nested-list').should('not.be.visible');

      cy.get('li[data-testid="superusefulgithublinks"] a[title="Super useful Github links"]').click();

      // First one is open only
      cy.get('li[data-testid="superusefulgithublinks"]>ul.fd-nested-list').should('be.visible');
      cy.get('li[data-testid="usermanagement"]>ul.fd-nested-list').should('not.be.visible');

      cy.get('li[data-testid="usermanagement"] a[title="User Management"]').click();

      // Second one is open only
      cy.get('li[data-testid="superusefulgithublinks"]>ul.fd-nested-list').should('not.be.visible');
      cy.get('li[data-testid="usermanagement"]>ul.fd-nested-list').should('be.visible');

      cy.get('li[data-testid="usermanagement"] a[title="User Management"]').click();

      // All is closed
      cy.get('li[data-testid="superusefulgithublinks"]>ul.fd-nested-list').should('not.be.visible');
      cy.get('li[data-testid="usermanagement"]>ul.fd-nested-list').should('not.be.visible');
    });

    it('It should have a global side nav accordion mode', () => {
      cy.visit('/projects/pr2/collapsibles');
      cy.window().then(win => {
        const config = win.Luigi.getConfig();
        config.navigation.defaults = {
          sideNavAccordionMode: true
        };
        win.Luigi.configChanged('settings.navigation');
        // All is closed
        cy.get('li[data-testid="superusefulgithublinks"]>ul.fd-nested-list').should('not.be.visible');
        cy.get('li[data-testid="usermanagement"]>ul.fd-nested-list').should('not.be.visible');

        cy.get('li[data-testid="superusefulgithublinks"] a[title="Super useful Github links"]').click();

        // First one is open only
        cy.get('li[data-testid="superusefulgithublinks"]>ul.fd-nested-list').should('be.visible');
        cy.get('li[data-testid="usermanagement"]>ul.fd-nested-list').should('not.be.visible');

        cy.get('li[data-testid="usermanagement"] a[title="User Management"]').click();

        // Second one is open only
        cy.get('li[data-testid="superusefulgithublinks"]>ul.fd-nested-list').should('not.be.visible');
        cy.get('li[data-testid="usermanagement"]>ul.fd-nested-list').should('be.visible');

        cy.get('li[data-testid="usermanagement"] a[title="User Management"]').click();

        // All is closed
        cy.get('li[data-testid="superusefulgithublinks"]>ul.fd-nested-list').should('not.be.visible');
        cy.get('li[data-testid="usermanagement"]>ul.fd-nested-list').should('not.be.visible');
      });
    });
  });

  describe('Link withoutSync/withSync', () => {
    beforeEach(() => {
      cy.visitLoggedIn('/projects/pr2');
    });

    it('withoutSync -> it should remain on the current page, highlight tree menu and remain in same page', () => {
      cy.expectPathToBe('/projects/pr2');
      cy.getIframeBody().then(result => {
        // Link on Main page PR2 exist
        cy.wrap(result).contains(' with params: project to global settings and back');

        // checking if we have NOT highlighted  menu item
        cy.get('a[href="/projects/pr2/virtual-tree"]')
          .should('exist')
          .not('.is-selected');

        // CLICK ON navigate-withoutSync-virtual-tree
        // linkManager().withoutSync().navigate('/projects/pr2/virtual-tree')
        cy.wrap(result)
          .find('a[data-testid="navigate-withoutSync-virtual-tree"]')
          .click();

        // Url should changed in the main window
        cy.expectPathToBe('/projects/pr2/virtual-tree');
        // Click link is still here (we haven't changed page)
        cy.wrap(result).find('a[data-testid="navigate-withoutSync-virtual-tree"]');
        // checking if we have highlighted  menu item
        cy.get('a[href="/projects/pr2/virtual-tree"]')
          .should('exist')
          .should('have.class', 'is-selected');

        // checking if we have NOT highlighted  menu item
        cy.get('a[href="/projects/pr2/settings"]')
          .should('exist')
          .not('.is-selected');

        // CLICK ON navigate-withoutSync-virtual-tree
        // linkManager().withoutSync().navigate('/projects/pr2/virtual-tree')
        cy.wrap(result)
          .find('a[data-testid="navigate-withoutSync-settings"]')
          .click();

        // Url should changed in the main window
        cy.expectPathToBe('/projects/pr2/settings');
        // Click link is still here (we haven't changed page)
        cy.wrap(result).find('a[data-testid="navigate-withoutSync-virtual-tree"]');
        // checking if we have highlighted  menu item
        cy.get('a[href="/projects/pr2/settings"]')
          .should('exist')
          .should('have.class', 'is-selected');
      });
    });

    it('withSync -> it should change page', () => {
      cy.expectPathToBe('/projects/pr2');
      cy.getIframeBody().then(result => {
        // Link on Main page PR2 exist
        cy.wrap(result).contains(' with params: project to global settings and back');

        // checking if we have NOT highlighted  menu item
        cy.get('a[href="/projects/pr2/virtual-tree"]')
          .should('exist')
          .not('.is-selected');

        // CLICK ON navigate-withoutSync-virtual-tree
        // linkManager().withoutSync().navigate('/projects/pr2/virtual-tree')
        cy.wrap(result)
          .find('a[data-testid="navigate-withSync-virtual-tree"]')
          .click();

        // Url should changed in the main window
        cy.expectPathToBe('/projects/pr2/virtual-tree');

        // Check we have changed page
        cy.wrap(result)
          .contains(' with params: project to global settings and back')
          .should('not.exist');
        // checking if we have highlighted  menu item
        cy.get('a[href="/projects/pr2/virtual-tree"]')
          .should('exist')
          .should('have.class', 'is-selected');

        cy.wrap(result).contains('Add Segments To The Url content');
      });
    });
  });

  describe('Global Navigation', () => {
    context('Desktop', () => {
      it('not render global side navigation when globalSideNavigation is false', () => {
        cy.window().then(win => {
          const config = win.Luigi.getConfig();
          config.settings.globalSideNavigation = false;
          config.settings.experimental = { globalNav: true };
          win.Luigi.configChanged();

          cy.get('.lui-global-nav-visible').should('not.be.visible');
          cy.get('.lui-globalnav .fd-side-nav').should('not.be.visible');
        });
      });

      it('not render global side navigation when experimental globalNav is false', () => {
        cy.window().then(win => {
          const config = win.Luigi.getConfig();
          config.settings.globalSideNavigation = true;
          config.settings.experimental = { globalNav: false };
          win.Luigi.configChanged();

          cy.get('.lui-global-nav-visible').should('not.be.visible');
          cy.get('.lui-globalnav .fd-side-nav').should('not.be.visible');
        });
      });

      it('render global side navigation', () => {
        cy.window().then(win => {
          const config = win.Luigi.getConfig();
          config.settings.globalSideNavigation = true;
          config.settings.experimental = { globalNav: true };
          win.Luigi.configChanged();

          // render global nav tool bar
          cy.get('.lui-global-nav-visible').should('be.visible');
          cy.get('.lui-globalnav .fd-side-nav__main-navigation .fd-nested-list')
            .should('be.visible')
            .children()
            .should('have.length', 2);

          // select global nav node
          cy.get('[data-testid="settings_settings"]')
            .should('exist')
            .not('.is-selected')
            .click();

          // select global nav node again to wait for the rerendering of the element
          cy.get('[data-testid="settings_settings"]').should('have.class', 'is-selected');

          cy.expectPathToBe('/settings');
        });
      });
    });
    context('Mobile', () => {
      beforeEach(() => {
        cy.viewport('iphone-6');
      });

      it('Responsive Global Side Navigation', () => {
        cy.viewport(800, 600);
        cy.window().then(win => {
          const config = win.Luigi.getConfig();
          config.settings.globalSideNavigation = true;
          config.settings.experimental = { globalNav: true };
          win.Luigi.configChanged();

          cy.get('.lui-globalnav').should('be.visible');
          cy.get('.lui-globalnav .fd-side-nav__main-navigation .fd-nested-list')
            .should('be.visible')
            .children()
            .should('have.length', 2);
        });
      });
    });
  });

  describe('ProfileMenu Fiori 3 Style', () => {
    context('Desktop', () => {
      it('not render Fiori3 profile in Shellbar when profileType is equal "simple"', () => {
        cy.window().then(win => {
          const config = win.Luigi.getConfig();
          config.settings.profileType = 'simple';
          win.Luigi.configChanged();

          cy.get('[data-testid="luigi-topnav-profile-btn"]')
            .should('exist')
            .click();
          cy.get('.lui-user-menu-fiori').should('not.be.visible');
          cy.get('.lui-profile-simple-menu').should('be.visible');
        });
      });

      it('not render Fiori3 profile in Shellbar when experimental is equal false', () => {
        cy.window().then(win => {
          const config = win.Luigi.getConfig();
          config.settings.profileType = 'Fiori3';
          config.settings.experimental = { profileMenuFiori3: false };
          win.Luigi.configChanged();

          cy.get('[data-testid="luigi-topnav-profile-btn"]')
            .should('exist')
            .click();
          cy.get('.lui-user-menu-fiori').should('not.be.visible');
          cy.get('.lui-profile-simple-menu').should('be.visible');
        });
      });

      it('should render Fiori3 profile in Shellbar when profileType is equal "Fiori3"', () => {
        cy.window().then(win => {
          const config = win.Luigi.getConfig();
          config.settings.profileType = 'Fiori3';
          config.settings.experimental = { profileMenuFiori3: true };
          win.Luigi.configChanged();
          cy.wait(1000);

          cy.get('[data-testid="luigi-topnav-profile-btn"]').should('exist');
          cy.get('[data-testid="luigi-topnav-profile-btn"]').click();
          cy.get('.lui-user-menu-fiori').should('be.visible');
          cy.get('.lui-profile-simple-menu').should('not.be.visible');
        });
      });

      it('should have User Description and Avatar when Fiori3 Profile Menu is enabled', () => {
        cy.window().then(win => {
          const config = win.Luigi.getConfig();
          config.settings.profileType = 'Fiori3';
          config.settings.experimental = { profileMenuFiori3: true };
          win.Luigi.configChanged();

          cy.wait(1000);

          cy.get('[data-testid="luigi-topnav-profile-btn"]').should('exist');
          cy.get('[data-testid="luigi-topnav-profile-btn"]').click();
          cy.get('[data-testid="luigi-topnav-profile-avatar"]').should('exist');
          cy.get('[data-testid="luigi-topnav-profile-initials"]').should('not.exist');
          cy.get('[data-testid="luigi-topnav-profile-icon"]').should('not.exist');
        });
      });
    });
  });
});
