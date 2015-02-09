# dotmake

Meta-framework for software projects.

Orchestration of your build tools, CI and test runners, with easy scaffolding to tap into a library of testing and definition-of-done recipes. Declarative. Stack-agnostic. Product manager and QA oriented.

## `.make.yml` Format

Describes the attributes of a project, which include dependencies, CI implementation details and the definition of done.

There is definitive description of each part of the actual codebase, easily finding things that don't fit (like a linter).

## Notes

Projects don't typically need intrinsic identifiers, but there is always a need for an external reference mechanism to publish built artifacts, etc.

### Definition of Done

What is shipped is always an "executable". But that definition includes *installers*. Or things with clear install-recipes. Or manual instructions, acting like code for a person following a set of steps. So, a Debian package, a Java servlet bundle, a Rails app, a set of documentation, etc. Some things have implicit installer behaviour (such as Heroku deploys), some things are more explicit.

The acceptance test is simple: give a known set of inputs and check for a set of outputs. That's it.

The inputs are:

- environment variant
- legacy DB data pre-migration (webapp)
- existing configuration (webapp, etc)
- series of user actions
- series of external events from other data sources

This is a very broad, but also inclusive definition. We are calling out to the ticker-tape mathematical definition of algorithms, but attempting to take into account a myriad things that modern software has to work with.
