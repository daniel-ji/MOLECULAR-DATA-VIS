import networkx as nx

# check if G global variable exists
if (G is None):
    print("Error: G is not defined")
    exit()

# calculate assortativity, transitivity, and triangle count
G = nx.Graph([tuple(l) for l in G])
assortativity = nx.degree_pearson_correlation_coefficient(G)
transitivity = nx.transitivity(G)
triangle_count = sum(nx.triangles(G).values()) / 3