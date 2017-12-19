class Eggception(Exception):
    pass

class GameAlreadyExists(Eggception):
    pass

class GameDoesNotExist(Eggception):
    pass

class GameAliasNotFound(Eggception):
    pass

class GameStatusException(Eggception):
    pass

class UnauthorizedAction(Eggception):
    pass